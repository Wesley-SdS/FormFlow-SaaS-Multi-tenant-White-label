import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { FormRepository } from '@/infrastructure/db/form.repository';
import { FormVersionRepository } from '@/infrastructure/db/form-version.repository';
import PublicFormRenderer from './PublicFormRenderer';

interface PublicFormPageProps {
  params: Promise<{ formSlug: string }>;
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { formSlug } = await params;
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');

  if (!tenantId) {
    notFound();
  }

  const formRepo = new FormRepository();
  const form = await formRepo.findBySlug(formSlug, tenantId);

  if (!form || !form.isPublished()) {
    notFound();
  }

  const versionRepo = new FormVersionRepository();
  const version = await versionRepo.findLatestByFormId(form.id, tenantId);

  if (!version) {
    notFound();
  }

  return <PublicFormRenderer form={form.toJSON()} version={version.toJSON()} />;
}
