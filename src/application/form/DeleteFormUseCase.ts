import { Result } from '@/domain/shared/Result';
import { FormNotFoundError } from '@/domain/shared/DomainError';
import type { DomainError } from '@/domain/shared/DomainError';
import type { IFormRepository } from '@/domain/form/IFormRepository';

export interface DeleteFormDTO {
  formId: string;
  tenantId: string;
}

export class DeleteFormUseCase {
  constructor(private readonly formRepo: IFormRepository) {}

  async execute(dto: DeleteFormDTO): Promise<Result<void, DomainError>> {
    const existing = await this.formRepo.findById(dto.formId, dto.tenantId);
    if (!existing) {
      return Result.fail(new FormNotFoundError(dto.formId));
    }

    await this.formRepo.delete(dto.formId, dto.tenantId);
    return Result.ok(undefined);
  }
}
