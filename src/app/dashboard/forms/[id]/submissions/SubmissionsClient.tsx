'use client';

import { useState } from 'react';
import type { SubmissionProps } from '@/domain/submission/Submission.entity';
import type { FormFieldProps } from '@/domain/form/FormField.vo';

interface SubmissionsClientProps {
  initialSubmissions: SubmissionProps[];
  formId: string;
  formSlug: string;
  schema: FormFieldProps[];
  total: number;
}

export default function SubmissionsClient({
  initialSubmissions,
  formId,
  formSlug,
  schema,
  total,
}: SubmissionsClientProps) {
  const [submissions, setSubmissions] = useState<SubmissionProps[]>(initialSubmissions);
  const [totalCount, setTotalCount] = useState(total);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null);

  const fieldLabels = schema.reduce<Record<string, string>>((acc, f) => {
    acc[f.id] = f.label;
    return acc;
  }, {});

  const applyFilter = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '25' });
      if (dateFrom) params.set('dateFrom', new Date(dateFrom).toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        params.set('dateTo', end.toISOString());
      }

      const res = await fetch(`/api/forms/${formId}/submissions?${params}`);
      const body = await res.json();
      setSubmissions(body.submissions);
      setTotalCount(body.total);
      setNextCursor(body.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '25', cursor: nextCursor });
      if (dateFrom) params.set('dateFrom', new Date(dateFrom).toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        params.set('dateTo', end.toISOString());
      }

      const res = await fetch(`/api/forms/${formId}/submissions?${params}`);
      const body = await res.json();
      setSubmissions((prev) => [...prev, ...body.submissions]);
      setNextCursor(body.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(format);
    try {
      const res = await fetch(`/api/forms/${formId}/submissions/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formSlug}-submissions.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros + Export */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">De</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Até</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="button"
          onClick={applyFilter}
          disabled={loading}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Filtrar
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={exporting !== null || submissions.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <DownloadIcon />
            {exporting === 'csv' ? 'Exportando...' : 'CSV'}
          </button>
          <button
            type="button"
            onClick={() => handleExport('json')}
            disabled={exporting !== null || submissions.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <DownloadIcon />
            {exporting === 'json' ? 'Exportando...' : 'JSON'}
          </button>
        </div>
      </div>

      {/* Tabela */}
      {submissions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                    Data/hora
                  </th>
                  {schema.slice(0, 4).map((f) => (
                    <th
                      key={f.id}
                      className="max-w-[180px] px-4 py-3 text-left text-xs font-semibold text-zinc-500"
                    >
                      {f.label}
                    </th>
                  ))}
                  {schema.length > 4 && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                      +{schema.length - 4} campos
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {submissions.map((sub) => (
                  <SubmissionRow
                    key={sub.id}
                    submission={sub}
                    schema={schema}
                    fieldLabels={fieldLabels}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {nextCursor && (
            <div className="border-t border-zinc-100 px-4 py-3">
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
              >
                {loading
                  ? 'Carregando...'
                  : `Carregar mais (${totalCount - submissions.length} restantes)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubmissionRow({
  submission,
  schema,
  fieldLabels,
}: {
  submission: SubmissionProps;
  schema: FormFieldProps[];
  fieldLabels: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(submission.createdAt);
  const visibleFields = schema.slice(0, 4);
  const hiddenFields = schema.slice(4);

  return (
    <>
      <tr
        className="cursor-pointer transition-colors hover:bg-zinc-50"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
          {date.toLocaleDateString('pt-BR')}{' '}
          {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </td>
        {visibleFields.map((f) => (
          <td key={f.id} className="max-w-[180px] px-4 py-3">
            <span className="block truncate text-zinc-800">
              {formatValue(submission.data[f.id])}
            </span>
          </td>
        ))}
        {hiddenFields.length > 0 && (
          <td className="px-4 py-3 text-xs text-zinc-400">
            {expanded ? '▲ Recolher' : '▼ Ver mais'}
          </td>
        )}
      </tr>

      {expanded && hiddenFields.length > 0 && (
        <tr className="bg-zinc-50">
          <td colSpan={visibleFields.length + 2} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {hiddenFields.map((f) => (
                <div key={f.id}>
                  <p className="text-xs font-medium text-zinc-400">{fieldLabels[f.id] ?? f.id}</p>
                  <p className="mt-0.5 text-sm text-zinc-800">
                    {formatValue(submission.data[f.id])}
                  </p>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  return String(v);
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <svg
          className="h-6 w-6 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
          />
        </svg>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-zinc-800">Nenhuma resposta ainda</h3>
      <p className="mt-1 text-sm text-zinc-500">
        As respostas aparecerão aqui quando alguém preencher o formulário.
      </p>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}
