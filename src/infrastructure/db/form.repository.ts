import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma.client';
import { withTenantContext } from './withTenantContext';
import { Form } from '@/domain/form/Form.entity';
import type { FormStatus } from '@/domain/form/Form.entity';
import type {
  IFormRepository,
  CreateFormDTO,
  UpdateFormDTO,
  ListFormsOptions,
  ListFormsResult,
} from '@/domain/form/IFormRepository';
import type { FormFieldProps } from '@/domain/form/FormField.vo';
import { FormStatus as PrismaFormStatus } from '@prisma/client';

function toFormStatus(s: PrismaFormStatus): FormStatus {
  return s as FormStatus;
}

function mapToForm(row: {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description: string | null;
  schema: unknown;
  status: PrismaFormStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  webhookUrl?: string | null;
  successMessage?: string | null;
  redirectUrl?: string | null;
}): Form {
  return Form.reconstitute({
    id: row.id,
    tenantId: row.tenantId,
    slug: row.slug,
    title: row.title,
    description: row.description,
    schema: (row.schema as FormFieldProps[]) ?? [],
    status: toFormStatus(row.status),
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    webhookUrl: row.webhookUrl ?? null,
    successMessage: row.successMessage ?? null,
    redirectUrl: row.redirectUrl ?? null,
  });
}

export class FormRepository implements IFormRepository {
  async create(dto: CreateFormDTO): Promise<Form> {
    const row = await withTenantContext(dto.tenantId, (tx) =>
      tx.form.create({
        data: {
          id: dto.id,
          tenantId: dto.tenantId,
          slug: dto.slug,
          title: dto.title,
          description: dto.description ?? null,
          schema: [] as unknown as Prisma.InputJsonValue,
          status: PrismaFormStatus.draft,
        },
      })
    );
    return mapToForm(row);
  }

  async findById(formId: string, tenantId: string): Promise<Form | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.form.findUnique({ where: { id: formId } })
    );
    return row ? mapToForm(row) : null;
  }

  async findBySlug(slug: string, tenantId: string): Promise<Form | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.form.findUnique({ where: { tenantId_slug: { tenantId, slug } } })
    );
    return row ? mapToForm(row) : null;
  }

  async update(formId: string, tenantId: string, dto: UpdateFormDTO): Promise<Form> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.form.update({
        where: { id: formId },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.schema !== undefined && {
            schema: dto.schema as unknown as Prisma.InputJsonValue,
          }),
          ...(dto.webhookUrl !== undefined && { webhookUrl: dto.webhookUrl }),
          ...(dto.successMessage !== undefined && { successMessage: dto.successMessage }),
          ...(dto.redirectUrl !== undefined && { redirectUrl: dto.redirectUrl }),
        },
      })
    );
    return mapToForm(row);
  }

  async updateStatus(
    formId: string,
    status: FormStatus,
    tenantId: string,
    publishedAt?: Date
  ): Promise<Form> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.form.update({
        where: { id: formId },
        data: {
          status: status as PrismaFormStatus,
          ...(publishedAt !== undefined && { publishedAt }),
        },
      })
    );
    return mapToForm(row);
  }

  async delete(formId: string, tenantId: string): Promise<void> {
    await withTenantContext(tenantId, (tx) => tx.form.delete({ where: { id: formId } }));
  }

  async list(options: ListFormsOptions): Promise<ListFormsResult> {
    const limit = options.limit ?? 20;

    const where = {
      tenantId: options.tenantId,
      ...(options.status && { status: options.status as PrismaFormStatus }),
      ...(options.search && {
        title: { contains: options.search, mode: 'insensitive' as const },
      }),
    };

    const [total, rows] = await withTenantContext(options.tenantId, async (tx) => {
      const countResult = await tx.form.count({ where });
      const formsResult = await tx.form.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(options.cursor && {
          cursor: { id: options.cursor },
          skip: 1,
        }),
      });
      return [countResult, formsResult] as const;
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return {
      forms: items.map(mapToForm),
      nextCursor,
      total,
    };
  }

  async countByTenant(tenantId: string): Promise<number> {
    return withTenantContext(tenantId, (tx) => tx.form.count({ where: { tenantId } }));
  }

  generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || randomUUID().slice(0, 8)
    );
  }
}
