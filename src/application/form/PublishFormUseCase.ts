import { randomUUID } from 'crypto';
import { Result } from '@/domain/shared/Result';
import {
  FormNotFoundError,
  FormEmptyError,
  FormAlreadyPublishedError,
} from '@/domain/shared/DomainError';
import type { DomainError } from '@/domain/shared/DomainError';
import type { FormVersion } from '@/domain/form/FormVersion.entity';
import type { IFormRepository } from '@/domain/form/IFormRepository';
import type { IFormVersionRepository } from '@/domain/form/IFormVersionRepository';

export interface PublishFormDTO {
  formId: string;
  tenantId: string;
}

export class PublishFormUseCase {
  constructor(
    private readonly formRepo: IFormRepository,
    private readonly versionRepo: IFormVersionRepository
  ) {}

  async execute(dto: PublishFormDTO): Promise<Result<FormVersion, DomainError>> {
    const form = await this.formRepo.findById(dto.formId, dto.tenantId);
    if (!form) {
      return Result.fail(new FormNotFoundError(dto.formId));
    }

    if (form.isPublished()) {
      return Result.fail(new FormAlreadyPublishedError(dto.formId));
    }

    if (form.fields.length === 0) {
      return Result.fail(new FormEmptyError());
    }

    const versionCount = await this.versionRepo.countByFormId(dto.formId);

    const version = await this.versionRepo.create({
      id: randomUUID(),
      formId: form.id,
      tenantId: dto.tenantId,
      versionNumber: versionCount + 1,
      schema: form.schema,
    });

    await this.formRepo.updateStatus(dto.formId, 'published', dto.tenantId, new Date());

    return Result.ok(version);
  }
}
