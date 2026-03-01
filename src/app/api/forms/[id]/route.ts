import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveTenantId } from '@/lib/resolve-tenant';
import { FormRepository } from '@/infrastructure/db/form.repository';
import { UpdateFormUseCase } from '@/application/form/UpdateFormUseCase';
import { DeleteFormUseCase } from '@/application/form/DeleteFormUseCase';

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  schema: z.array(z.record(z.unknown())).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await context.params;
  const repo = new FormRepository();
  const form = await repo.findById(id, tenantId);

  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ form: form.toJSON() });
}

export async function PATCH(request: Request, context: RouteContext) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validação falhou',
        fields: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
      { status: 422 }
    );
  }

  const useCase = new UpdateFormUseCase(new FormRepository());
  const result = await useCase.execute({
    formId: id,
    tenantId,
    title: parsed.data.title,
    description: parsed.data.description,
    schema: parsed.data.schema as never,
  });

  if (result.isFailure) {
    const status = result.error.code === 'FORM_NOT_FOUND' ? 404 : 400;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status });
  }

  return NextResponse.json({ form: result.value.toJSON() });
}

export async function DELETE(request: Request, context: RouteContext) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await context.params;
  const useCase = new DeleteFormUseCase(new FormRepository());
  const result = await useCase.execute({ formId: id, tenantId });

  if (result.isFailure) {
    const status = result.error.code === 'FORM_NOT_FOUND' ? 404 : 400;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status });
  }

  return NextResponse.json({ success: true });
}
