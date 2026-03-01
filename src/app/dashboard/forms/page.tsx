import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { FormRepository } from '@/infrastructure/db/form.repository';
import FormsClient from './FormsClient';

export const metadata: Metadata = {
  title: 'Formulários — FormFlow',
};

export default async function FormsPage() {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id') ?? '';

  const repo = new FormRepository();
  const { forms, total } = tenantId
    ? await repo.list({ tenantId, limit: 20 })
    : { forms: [], total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Formulários</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {total > 0
              ? `${total} formulário${total !== 1 ? 's' : ''}`
              : 'Crie e gerencie seus formulários públicos.'}
          </p>
        </div>
        <Link
          href="/dashboard/forms/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
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
          Novo formulário
        </Link>
      </div>

      <FormsClient initialForms={forms.map((f) => f.toJSON())} tenantId={tenantId} />
    </div>
  );
}
