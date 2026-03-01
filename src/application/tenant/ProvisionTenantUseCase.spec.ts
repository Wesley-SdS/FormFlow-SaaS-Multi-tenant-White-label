import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProvisionTenantUseCase } from './ProvisionTenantUseCase';
import type { ITenantRepository, TenantRecord } from '@/domain/tenant/ITenantRepository';
import type { IMemberRepository } from '@/domain/user/IMemberRepository';
import type { ISubdomainProvisioner } from '@/domain/tenant/ISubdomainProvisioner';
import type { IBillingService } from '@/domain/billing/IBillingService';
import { SlugAlreadyExistsError } from '@/domain/shared/DomainError';

function createTenantRecord(overrides: Partial<TenantRecord> = {}): TenantRecord {
  return {
    id: 'tenant-uuid',
    name: 'Minha Empresa',
    slug: 'minha-empresa',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    fontFamily: 'sans',
    borderRadius: 'md',
    logoUrl: null,
    faviconUrl: null,
    onboardingStep: 1,
    onboardingDoneAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ProvisionTenantUseCase', () => {
  let tenantRepo: ITenantRepository;
  let memberRepo: IMemberRepository;
  let provisioner: ISubdomainProvisioner;
  let billing: IBillingService;

  beforeEach(() => {
    tenantRepo = {
      create: vi.fn().mockResolvedValue(createTenantRecord()),
      slugExists: vi.fn().mockResolvedValue(false),
      findBySlug: vi.fn(),
      findById: vi.fn(),
      updateTheme: vi.fn(),
      updateOnboardingStep: vi.fn(),
      completeOnboarding: vi.fn(),
    };
    memberRepo = {
      addOwner: vi.fn().mockResolvedValue(undefined),
    };
    provisioner = {
      provision: vi.fn().mockResolvedValue(undefined),
    };
    billing = {
      createTrial: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('executa sequência: tenant → member → billing → provision', async () => {
    const useCase = new ProvisionTenantUseCase(tenantRepo, memberRepo, provisioner, billing);
    const dto = {
      name: 'Minha Empresa',
      slug: 'minha-empresa',
      userId: 'user-uuid',
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess).toBe(true);
    expect(tenantRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Minha Empresa', slug: 'minha-empresa' })
    );
    expect(tenantRepo.slugExists).toHaveBeenCalledWith('minha-empresa');
    expect(memberRepo.addOwner).toHaveBeenCalledWith('tenant-uuid', 'user-uuid');
    expect(billing.createTrial).toHaveBeenCalledWith('tenant-uuid');
    expect(provisioner.provision).toHaveBeenCalledWith('minha-empresa');
  });

  it('falha quando slug já existe', async () => {
    vi.mocked(tenantRepo.slugExists).mockResolvedValue(true);
    const useCase = new ProvisionTenantUseCase(tenantRepo, memberRepo, provisioner, billing);
    const result = await useCase.execute({
      name: 'Outra',
      slug: 'minha-empresa',
      userId: 'user-uuid',
    });
    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(SlugAlreadyExistsError);
    expect(tenantRepo.create).not.toHaveBeenCalled();
    expect(provisioner.provision).not.toHaveBeenCalled();
  });

  it('falha quando slug é inválido', async () => {
    const useCase = new ProvisionTenantUseCase(tenantRepo, memberRepo, provisioner, billing);
    const result = await useCase.execute({
      name: 'Outra',
      slug: 'inválido com espaços',
      userId: 'user-uuid',
    });
    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('SLUG_INVALID');
    expect(tenantRepo.create).not.toHaveBeenCalled();
  });
});
