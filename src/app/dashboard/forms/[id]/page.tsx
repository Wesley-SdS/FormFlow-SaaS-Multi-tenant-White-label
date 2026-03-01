import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { FormRepository } from '@/infrastructure/db/form.repository';
import FormBuilder from './FormBuilder';

interface FormEditorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FormEditorPageProps): Promise<Metadata> {
  const { id } = await params;
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id') ?? '';
  const repo = new FormRepository();
  const form = tenantId ? await repo.findById(id, tenantId) : null;
  return { title: form ? `${form.title} — FormFlow` : 'Editor de Formulário — FormFlow' };
}

export default async function FormEditorPage({ params }: FormEditorPageProps) {
  const { id } = await params;
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');

  if (!tenantId) {
    notFound();
  }

  const repo = new FormRepository();
  const form = await repo.findById(id, tenantId);

  if (!form) {
    notFound();
  }

  return <FormBuilder form={form.toJSON()} />;
}
