import type { ITenantRepository, TenantRecord } from '@/domain/tenant/ITenantRepository';
import type { IMemberRepository } from '@/domain/user/IMemberRepository';
import type { ISubdomainProvisioner } from '@/domain/tenant/ISubdomainProvisioner';
import type { IBillingService } from '@/domain/billing/IBillingService';
import { SlugVO } from '@/domain/tenant/Slug.vo';
import { Result } from '@/domain/shared/Result';
import { SlugInvalidError, SlugAlreadyExistsError } from '@/domain/shared/DomainError';

export interface ProvisionTenantDTO {
  name: string;
  slug: string;
  userId: string;
}

/**
 * Orquestra criação de tenant: valida slug, cria tenant, owner, subscription trial e subdomínio.
 * DIP: todas as dependências são abstrações.
 */
export class ProvisionTenantUseCase {
  constructor(
    private readonly tenantRepo: ITenantRepository,
    private readonly memberRepo: IMemberRepository,
    private readonly provisioner: ISubdomainProvisioner,
    private readonly billing: IBillingService
  ) {}

  async execute(
    dto: ProvisionTenantDTO
  ): Promise<Result<TenantRecord, SlugInvalidError | SlugAlreadyExistsError>> {
    const slugResult = SlugVO.create(dto.slug);
    if (slugResult.isFailure) {
      return Result.fail(slugResult.error);
    }

    const slugValue = slugResult.value.value;
    const exists = await this.tenantRepo.slugExists(slugValue);
    if (exists) {
      return Result.fail(new SlugAlreadyExistsError(slugValue));
    }

    const tenant = await this.tenantRepo.create({
      name: dto.name.trim(),
      slug: slugValue,
    });

    await this.memberRepo.addOwner(tenant.id, dto.userId);
    await this.billing.createTrial(tenant.id);
    await this.provisioner.provision(slugValue);

    return Result.ok(tenant);
  }
}
