import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateThemeUseCase } from './UpdateThemeUseCase';
import type { ITenantRepository, TenantRecord } from '@/domain/tenant/ITenantRepository';
import { TenantNotFoundError, ThemeValidationError } from '@/domain/shared/DomainError';

function createTenantRecord(overrides: Partial<TenantRecord> = {}): TenantRecord {
  return {
    id: 'tenant-uuid',
    name: 'Test',
    slug: 'test',
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

describe('UpdateThemeUseCase', () => {
  let tenantRepo: ITenantRepository;
  let invalidateCache: (slug: string) => Promise<void>;

  beforeEach(() => {
    tenantRepo = {
      create: vi.fn(),
      findBySlug: vi.fn(),
      findById: vi.fn().mockResolvedValue(createTenantRecord()),
      updateTheme: vi.fn().mockResolvedValue(createTenantRecord({ primaryColor: '#ff0000' })),
      updateOnboardingStep: vi.fn(),
      completeOnboarding: vi.fn(),
      slugExists: vi.fn(),
    };
    invalidateCache = vi.fn().mockResolvedValue(undefined);
  });

  it('atualiza tema e invalida cache', async () => {
    const useCase = new UpdateThemeUseCase(tenantRepo, invalidateCache);
    const result = await useCase.execute({
      tenantId: 'tenant-uuid',
      primaryColor: '#ff0000',
    });
    expect(result.isSuccess).toBe(true);
    expect(tenantRepo.updateTheme).toHaveBeenCalledWith('tenant-uuid', {
      primaryColor: '#ff0000',
    });
    expect(invalidateCache).toHaveBeenCalledWith('test');
  });

  it('rejeita hex inválido em primaryColor', async () => {
    const useCase = new UpdateThemeUseCase(tenantRepo, invalidateCache);
    const result = await useCase.execute({
      tenantId: 'tenant-uuid',
      primaryColor: 'red',
    });
    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ThemeValidationError);
    expect(tenantRepo.updateTheme).not.toHaveBeenCalled();
  });

  it('rejeita fontFamily fora do enum', async () => {
    const useCase = new UpdateThemeUseCase(tenantRepo, invalidateCache);
    const result = await useCase.execute({
      tenantId: 'tenant-uuid',
      fontFamily: 'invalid' as 'sans',
    });
    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ThemeValidationError);
  });

  it('rejeita borderRadius fora do enum', async () => {
    const useCase = new UpdateThemeUseCase(tenantRepo, invalidateCache);
    const result = await useCase.execute({
      tenantId: 'tenant-uuid',
      borderRadius: 'xl' as 'sm',
    });
    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ThemeValidationError);
  });

  it('retorna TenantNotFoundError quando tenant não existe', async () => {
    vi.mocked(tenantRepo.findById).mockResolvedValue(null);
    const useCase = new UpdateThemeUseCase(tenantRepo, invalidateCache);
    const result = await useCase.execute({
      tenantId: 'inexistente',
      primaryColor: '#ff0000',
    });
    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(TenantNotFoundError);
    expect(tenantRepo.updateTheme).not.toHaveBeenCalled();
  });
});
