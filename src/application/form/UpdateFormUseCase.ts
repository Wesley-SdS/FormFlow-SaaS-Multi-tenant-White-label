import { Result } from '@/domain/shared/Result';
import { FormNotFoundError } from '@/domain/shared/DomainError';
import type { DomainError } from '@/domain/shared/DomainError';
import type { Form } from '@/domain/form/Form.entity';
import type { IFormRepository } from '@/domain/form/IFormRepository';
import type { FormFieldProps } from '@/domain/form/FormField.vo';

export interface UpdateFormDTO {
  formId: string;
  tenantId: string;
  title?: string;
  description?: string | null;
  schema?: FormFieldProps[];
}

export class UpdateFormUseCase {
  constructor(private readonly formRepo: IFormRepository) {}

  async execute(dto: UpdateFormDTO): Promise<Result<Form, DomainError>> {
    const existing = await this.formRepo.findById(dto.formId, dto.tenantId);
    if (!existing) {
      return Result.fail(new FormNotFoundError(dto.formId));
    }

    const form = await this.formRepo.update(dto.formId, dto.tenantId, {
      title: dto.title,
      description: dto.description,
      schema: dto.schema,
    });

    return Result.ok(form);
  }
}
