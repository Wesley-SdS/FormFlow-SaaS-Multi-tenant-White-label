import { NextResponse } from 'next/server';
import { resolveTenantId } from '@/lib/resolve-tenant';
import { FormRepository } from '@/infrastructure/db/form.repository';
import { FormVersionRepository } from '@/infrastructure/db/form-version.repository';
import { PublishFormUseCase } from '@/application/form/PublishFormUseCase';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await context.params;

  const useCase = new PublishFormUseCase(new FormRepository(), new FormVersionRepository());
  const result = await useCase.execute({ formId: id, tenantId });

  if (result.isFailure) {
    const code = result.error.code;
    const status =
      code === 'FORM_NOT_FOUND'
        ? 404
        : code === 'FORM_EMPTY'
          ? 422
          : code === 'FORM_ALREADY_PUBLISHED'
            ? 409
            : 400;
    return NextResponse.json({ error: result.error.message, code }, { status });
  }

  return NextResponse.json({ version: result.value.toJSON() }, { status: 201 });
}
