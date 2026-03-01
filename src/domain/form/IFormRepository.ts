import type { Form, FormStatus } from './Form.entity';
import type { FormFieldProps } from './FormField.vo';

export interface CreateFormDTO {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description?: string;
}

export interface UpdateFormDTO {
  title?: string;
  description?: string | null;
  schema?: FormFieldProps[];
}

export interface ListFormsOptions {
  tenantId: string;
  status?: FormStatus;
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface ListFormsResult {
  forms: Form[];
  nextCursor: string | null;
  total: number;
}

export interface IFormRepository {
  create(dto: CreateFormDTO): Promise<Form>;
  findById(formId: string, tenantId: string): Promise<Form | null>;
  findBySlug(slug: string, tenantId: string): Promise<Form | null>;
  update(formId: string, tenantId: string, dto: UpdateFormDTO): Promise<Form>;
  updateStatus(
    formId: string,
    status: FormStatus,
    tenantId: string,
    publishedAt?: Date
  ): Promise<Form>;
  delete(formId: string, tenantId: string): Promise<void>;
  list(options: ListFormsOptions): Promise<ListFormsResult>;
  countByTenant(tenantId: string): Promise<number>;
}
