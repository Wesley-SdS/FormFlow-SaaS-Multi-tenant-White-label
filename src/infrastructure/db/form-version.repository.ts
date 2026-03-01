import { Prisma } from '@prisma/client';
import { prisma } from './prisma.client';
import { withTenantContext } from './withTenantContext';
import { FormVersion } from '@/domain/form/FormVersion.entity';
import type {
  IFormVersionRepository,
  CreateFormVersionDTO,
} from '@/domain/form/IFormVersionRepository';
import type { FormFieldProps } from '@/domain/form/FormField.vo';

function mapToVersion(row: {
  id: string;
  formId: string;
  tenantId: string;
  versionNumber: number;
  schema: unknown;
  publishedAt: Date;
}): FormVersion {
  return FormVersion.reconstitute({
    id: row.id,
    formId: row.formId,
    tenantId: row.tenantId,
    versionNumber: row.versionNumber,
    schema: (row.schema as FormFieldProps[]) ?? [],
    publishedAt: row.publishedAt,
  });
}

export class FormVersionRepository implements IFormVersionRepository {
  async create(dto: CreateFormVersionDTO): Promise<FormVersion> {
    const row = await withTenantContext(dto.tenantId, (tx) =>
      tx.formVersion.create({
        data: {
          id: dto.id,
          formId: dto.formId,
          tenantId: dto.tenantId,
          versionNumber: dto.versionNumber,
          schema: dto.schema as unknown as Prisma.InputJsonValue,
        },
      })
    );
    return mapToVersion(row);
  }

  async findLatestByFormId(formId: string, tenantId: string): Promise<FormVersion | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.formVersion.findFirst({
        where: { formId },
        orderBy: { versionNumber: 'desc' },
      })
    );
    return row ? mapToVersion(row) : null;
  }

  async countByFormId(formId: string): Promise<number> {
    return prisma.formVersion.count({ where: { formId } });
  }
}
