import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveTenantId } from '@/lib/resolve-tenant';
import { SubmissionRepository } from '@/infrastructure/db/submission.repository';

const listSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id: formId } = await context.params;
  const { searchParams } = new URL(request.url);

  const parsed = listSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 422 });
  }

  const repo = new SubmissionRepository();
  const result = await repo.list({
    tenantId,
    formId,
    cursor: parsed.data.cursor,
    limit: parsed.data.limit,
    dateFrom: parsed.data.dateFrom ? new Date(parsed.data.dateFrom) : undefined,
    dateTo: parsed.data.dateTo ? new Date(parsed.data.dateTo) : undefined,
  });

  return NextResponse.json({
    submissions: result.submissions.map((s) => s.toJSON()),
    nextCursor: result.nextCursor,
    total: result.total,
  });
}
