import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { FormRepository } from '@/infrastructure/db/form.repository';
import { SubmissionRepository } from '@/infrastructure/db/submission.repository';
import SubmissionsClient from './SubmissionsClient';

interface SubmissionsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SubmissionsPageProps): Promise<Metadata> {
  const { id } = await params;
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id') ?? '';
  const repo = new FormRepository();
  const form = tenantId ? await repo.findById(id, tenantId) : null;
  return { title: form ? `Respostas: ${form.title} — FormFlow` : 'Respostas — FormFlow' };
}

export default async function SubmissionsPage({ params }: SubmissionsPageProps) {
  const { id: formId } = await params;
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');

  if (!tenantId) notFound();

  const formRepo = new FormRepository();
  const form = await formRepo.findById(formId, tenantId);
  if (!form) notFound();

  const submissionRepo = new SubmissionRepository();
  const { submissions, total } = await submissionRepo.list({
    tenantId,
    formId,
    limit: 25,
  });

  const formData = form.toJSON();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/forms/${formId}`}
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            ← {form.title}
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">Respostas</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {total} resposta{total !== 1 ? 's' : ''} recebida{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <SubmissionsClient
        initialSubmissions={submissions.map((s) => s.toJSON())}
        formId={formId}
        formSlug={formData.slug}
        schema={formData.schema}
        total={total}
      />
    </div>
  );
}
