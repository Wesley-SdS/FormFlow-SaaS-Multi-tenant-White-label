import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveTenantId } from '@/lib/resolve-tenant';
import { FormRepository } from '@/infrastructure/db/form.repository';
import { TenantRepository } from '@/infrastructure/db/tenant.repository';
import { CreateFormUseCase } from '@/application/form/CreateFormUseCase';
import type { FormStatus } from '@/domain/form/Form.entity';

const createSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(120),
  description: z.string().max(500).optional(),
});

const listSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function POST(request: Request) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validação falhou',
        fields: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
      { status: 422 }
    );
  }

  const useCase = new CreateFormUseCase(new FormRepository(), new TenantRepository());
  const result = await useCase.execute({ tenantId, ...parsed.data });

  if (result.isFailure) {
    const error = result.error;
    const status = error.code === 'PLAN_LIMIT_EXCEEDED' ? 403 : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }

  return NextResponse.json({ form: result.value.toJSON() }, { status: 201 });
}

export async function GET(request: Request) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = listSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Parâmetros inválidos',
        fields: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
      { status: 422 }
    );
  }

  const repo = new FormRepository();
  const result = await repo.list({
    tenantId,
    status: parsed.data.status as FormStatus | undefined,
    search: parsed.data.search,
    cursor: parsed.data.cursor,
    limit: parsed.data.limit,
  });

  return NextResponse.json({
    forms: result.forms.map((f) => f.toJSON()),
    nextCursor: result.nextCursor,
    total: result.total,
  });
}
