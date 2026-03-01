import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { TenantRepository } from '@/infrastructure/db/tenant.repository';

const updateStepSchema = z.object({
  step: z.number().int().min(1).max(3),
  completed: z.boolean().optional(),
});

const tenantRepo = new TenantRepository();

/**
 * Resolve o tenantId: prioriza o cookie de sessão do signup (formflow_tenant_id)
 * quando está em localhost/dev. Em produção, o middleware injeta x-tenant-id pelo subdomínio.
 */
async function resolveTenantId(request: Request): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieTenantId = cookieStore.get('formflow_tenant_id')?.value ?? null;
  const headerTenantId = request.headers.get('x-tenant-id');

  // Prefere o cookie quando presente (tenant recém-criado no signup)
  return cookieTenantId ?? headerTenantId;
}

export async function GET(request: Request) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json(
      { error: 'Tenant não identificado', redirect: '/signup' },
      { status: 401 }
    );
  }

  const tenant = await tenantRepo.findById(tenantId);
  if (!tenant) {
    // Cookie stale ou tenant inválido: limpa o cookie e pede novo signup
    const res = NextResponse.json(
      { error: 'Sessão expirada. Faça signup novamente.', redirect: '/signup' },
      { status: 404 }
    );
    res.cookies.delete('formflow_tenant_id');
    return res;
  }

  return NextResponse.json({
    step: tenant.onboardingStep,
    done: tenant.onboardingDoneAt != null,
  });
}

export async function PATCH(request: Request) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant não identificado' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const parsed = updateStepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validação falhou', fields: parsed.error.errors },
      { status: 422 }
    );
  }

  const tenant = await tenantRepo.findById(tenantId);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
  }

  if (parsed.data.completed) {
    await tenantRepo.completeOnboarding(tenantId);
    const completedRes = NextResponse.json({ step: 3, done: true });
    completedRes.cookies.delete('formflow_tenant_id');
    return completedRes;
  }

  await tenantRepo.updateOnboardingStep(tenantId, parsed.data.step);
  return NextResponse.json({ step: parsed.data.step, done: false });
}
