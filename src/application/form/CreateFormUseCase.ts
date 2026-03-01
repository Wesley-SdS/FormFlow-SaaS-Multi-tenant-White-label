import { randomUUID } from 'crypto';
import { Result } from '@/domain/shared/Result';
import { PlanLimitError } from '@/domain/shared/DomainError';
import type { DomainError } from '@/domain/shared/DomainError';
import type { Form } from '@/domain/form/Form.entity';
import type { IFormRepository } from '@/domain/form/IFormRepository';
import type { ITenantRepository } from '@/domain/tenant/ITenantRepository';
import { PLAN_FORM_LIMITS } from '@/domain/billing/plan-limits';

export interface CreateFormDTO {
  tenantId: string;
  title: string;
  description?: string;
}

export class CreateFormUseCase {
  constructor(
    private readonly formRepo: IFormRepository,
    private readonly tenantRepo: ITenantRepository
  ) {}

  async execute(dto: CreateFormDTO): Promise<Result<Form, DomainError>> {
    const tenant = await this.tenantRepo.findById(dto.tenantId);
    if (!tenant) {
      return Result.fail(
        new (await import('@/domain/shared/DomainError')).TenantNotFoundError(dto.tenantId)
      );
    }

    const planLimit = await this.resolvePlanLimit(dto.tenantId);
    if (planLimit !== null) {
      const current = await this.formRepo.countByTenant(dto.tenantId);
      if (current >= planLimit) {
        return Result.fail(new PlanLimitError(`forms (máximo: ${planLimit})`));
      }
    }

    const baseSlug = this.generateSlug(dto.title);
    const slug = await this.ensureUniqueSlug(baseSlug, dto.tenantId);

    const form = await this.formRepo.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      slug,
      title: dto.title,
      description: dto.description,
    });

    return Result.ok(form);
  }

  private async resolvePlanLimit(tenantId: string): Promise<number | null> {
    try {
      const { prisma } = await import('@/infrastructure/db/prisma.client');
      const sub = await prisma.subscription.findUnique({
        where: { tenantId },
        include: { plan: true },
      });
      const planSlug = sub?.plan?.slug ?? 'starter';
      return PLAN_FORM_LIMITS[planSlug] ?? null;
    } catch {
      return PLAN_FORM_LIMITS['starter']!;
    }
  }

  private async ensureUniqueSlug(base: string, tenantId: string): Promise<string> {
    let slug = base;
    let attempts = 0;
    while (attempts < 10) {
      const existing = await this.formRepo.findBySlug(slug, tenantId);
      if (!existing) return slug;
      attempts++;
      slug = `${base}-${attempts}`;
    }
    return `${base}-${randomUUID().slice(0, 6)}`;
  }

  private generateSlug(title: string): string {
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
