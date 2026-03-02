import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { checkRateLimit, hashIp } from '@/infrastructure/rate-limiter';
import { FormRepository } from '@/infrastructure/db/form.repository';
import { FormVersionRepository } from '@/infrastructure/db/form-version.repository';
import { SubmissionRepository } from '@/infrastructure/db/submission.repository';
import { NotificationQueueAdapter } from '@/infrastructure/queue/notification-queue.adapter';
import { PlanLimitChecker } from '@/infrastructure/billing/plan-limit-checker';
import { SubmitFormUseCase } from '@/application/submission/SubmitFormUseCase';

const submitSchema = z.object({
  data: z.record(z.unknown()),
  _hp: z.string().optional(), // honeypot field
});

type RouteContext = { params: Promise<{ formSlug: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { formSlug } = await context.params;
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant não identificado' }, { status: 400 });
  }

  // Rate limiting: 10 req/min por IP por form
  const ip =
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerStore.get('x-real-ip') ??
    '0.0.0.0';

  const rateLimitKey = `rate:submit:${await hashIp(ip)}:${tenantId}:${formSlug}`;
  const rateCheck = await checkRateLimit({
    key: rateLimitKey,
    limit: 10,
    windowSeconds: 60,
  });

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde antes de tentar novamente.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateCheck.retryAfter ?? 60) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Payload inválido',
        fields: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
      { status: 422 }
    );
  }

  // Buscar form para obter ID e configurações
  const formRepo = new FormRepository();
  const form = await formRepo.findBySlug(formSlug, tenantId);

  if (!form || !form.isPublished()) {
    return NextResponse.json({ error: 'Formulário não disponível' }, { status: 404 });
  }

  const ipHash = await hashIp(ip);
  const userAgent = request.headers.get('user-agent') ?? undefined;

  const useCase = new SubmitFormUseCase(
    formRepo,
    new FormVersionRepository(),
    new SubmissionRepository(),
    new NotificationQueueAdapter(),
    new PlanLimitChecker()
  );

  const result = await useCase.execute({
    tenantId,
    formId: form.id,
    formVersionId: '', // resolvido internamente pelo use case
    data: parsed.data.data,
    honeypot: parsed.data._hp,
    ipHash,
    userAgent,
    webhookUrl: form.toJSON().webhookUrl ?? undefined,
  });

  if (result.isFailure) {
    const code = result.error.code;
    const status =
      code === 'SUBMISSION_LIMIT_EXCEEDED'
        ? 403
        : code === 'SUBMISSION_VALIDATION'
          ? 422
          : code === 'RATE_LIMIT_EXCEEDED'
            ? 429
            : 400;

    const extra =
      code === 'SUBMISSION_VALIDATION'
        ? { fields: (result.error as { fieldErrors?: unknown }).fieldErrors }
        : {};

    return NextResponse.json({ error: result.error.message, code, ...extra }, { status });
  }

  const { successMessage, redirectUrl } = result.value;

  return NextResponse.json({ success: true, message: successMessage, redirectUrl });
}
