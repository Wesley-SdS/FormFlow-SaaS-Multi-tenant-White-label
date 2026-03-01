'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormProps, FormStatus } from '@/domain/form/Form.entity';

const STATUS_LABELS: Record<FormStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
};

const STATUS_COLORS: Record<FormStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-amber-100 text-amber-700',
};

interface FormsClientProps {
  initialForms: FormProps[];
  tenantId: string;
}

export default function FormsClient({ initialForms }: FormsClientProps) {
  const router = useRouter();
  const [forms, setForms] = useState<FormProps[]>(initialForms);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'all'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = forms.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (formId: string) => {
    if (!confirm('Tem certeza que deseja excluir este formulário?')) return;
    setDeletingId(formId);
    try {
      const res = await fetch(`/api/forms/${formId}`, { method: 'DELETE' });
      if (res.ok) {
        setForms((prev) => prev.filter((f) => f.id !== formId));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (formId: string) => {
    const res = await fetch(`/api/forms/${formId}/publish`, { method: 'POST' });
    if (res.ok) {
      setForms((prev) => prev.map((f) => (f.id === formId ? { ...f, status: 'published' } : f)));
      router.refresh();
    } else {
      const body = await res.json();
      alert(body.error ?? 'Não foi possível publicar');
    }
  };

  if (forms.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar formulários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FormStatus | 'all')}
          className="rounded-xl border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Todos os status</option>
          <option value="draft">Rascunhos</option>
          <option value="published">Publicados</option>
          <option value="archived">Arquivados</option>
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">Nenhum formulário encontrado.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              onDelete={() => handleDelete(form.id)}
              onPublish={() => handlePublish(form.id)}
              deleting={deletingId === form.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FormCardProps {
  form: FormProps;
  onDelete: () => void;
  onPublish: () => void;
  deleting: boolean;
}

function FormCard({ form, onDelete, onPublish, deleting }: FormCardProps) {
  const fieldsCount = Array.isArray(form.schema) ? form.schema.length : 0;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <svg
          className="h-5 w-5 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
          />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-zinc-900">{form.title}</h3>
          <span
            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[form.status as FormStatus]}`}
          >
            {STATUS_LABELS[form.status as FormStatus]}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {fieldsCount} campo{fieldsCount !== 1 ? 's' : ''} · /{form.slug}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {form.status === 'draft' && (
          <button
            type="button"
            onClick={onPublish}
            className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
          >
            Publicar
          </button>
        )}

        {form.status === 'published' && (
          <a
            href={`/f/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            Ver público
          </a>
        )}

        <Link
          href={`/dashboard/forms/${form.id}`}
          className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          Editar
        </Link>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
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
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-20 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <svg
          className="h-7 w-7 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-[15px] font-semibold text-zinc-800">Nenhum formulário ainda</h2>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        Crie seu primeiro formulário com drag-and-drop, campos customizados e publicação com link
        público.
      </p>
      <Link
        href="/dashboard/forms/new"
        className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Criar formulário
      </Link>
    </div>
  );
}
