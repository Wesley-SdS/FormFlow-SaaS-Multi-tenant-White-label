import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveTenantId } from '@/lib/resolve-tenant';
import { SubmissionRepository } from '@/infrastructure/db/submission.repository';
import { FormRepository } from '@/infrastructure/db/form.repository';

const exportSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id: formId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = exportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 422 });
  }

  const formRepo = new FormRepository();
  const form = await formRepo.findById(formId, tenantId);
  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 });
  }

  const submissionRepo = new SubmissionRepository();
  const submissions = await submissionRepo.listAllForExport(tenantId, formId);

  const { format } = parsed.data;

  if (format === 'json') {
    const data = submissions.map((s) => ({
      id: s.id,
      data: s.data,
      createdAt: s.createdAt.toISOString(),
    }));

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${form.slug}-submissions.json"`,
      },
    });
  }

  // CSV format
  if (submissions.length === 0) {
    return new NextResponse('id,created_at\n', {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${form.slug}-submissions.csv"`,
      },
    });
  }

  const allKeys = new Set<string>();
  submissions.forEach((s) => {
    Object.keys(s.data).forEach((k) => allKeys.add(k));
  });

  const escapeCsv = (v: unknown): string => {
    const str = v == null ? '' : String(v);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const keys = ['id', 'created_at', ...Array.from(allKeys)];
  const header = keys.map(escapeCsv).join(',');
  const rows = submissions.map((s) =>
    keys
      .map((k) => {
        if (k === 'id') return escapeCsv(s.id);
        if (k === 'created_at') return escapeCsv(s.createdAt.toISOString());
        return escapeCsv(s.data[k]);
      })
      .join(',')
  );

  const csv = [header, ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${form.slug}-submissions.csv"`,
    },
  });
}
