import type { FormFieldProps } from './FormField.vo';
import type { FormVersion } from './FormVersion.entity';

export interface CreateFormVersionDTO {
  id: string;
  formId: string;
  tenantId: string;
  versionNumber: number;
  schema: FormFieldProps[];
}

export interface IFormVersionRepository {
  create(dto: CreateFormVersionDTO): Promise<FormVersion>;
  findLatestByFormId(formId: string, tenantId: string): Promise<FormVersion | null>;
  countByFormId(formId: string): Promise<number>;
}
