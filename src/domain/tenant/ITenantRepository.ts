/**
 * Abstração do repositório de tenants — DIP para testabilidade.
 * Implementação em infrastructure/db/tenant.repository.ts
 */

export interface CreateTenantData {
  name: string;
  slug: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: 'sans' | 'serif' | 'mono';
  borderRadius?: 'sm' | 'md' | 'lg';
}

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  onboardingStep: number;
  onboardingDoneAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITenantRepository {
  create(data: CreateTenantData): Promise<TenantRecord>;
  findBySlug(slug: string): Promise<TenantRecord | null>;
  findById(id: string): Promise<TenantRecord | null>;
  updateTheme(
    tenantId: string,
    theme: {
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
      borderRadius?: string;
      logoUrl?: string | null;
      faviconUrl?: string | null;
    }
  ): Promise<TenantRecord>;
  updateOnboardingStep(tenantId: string, step: number): Promise<void>;
  completeOnboarding(tenantId: string): Promise<void>;
  slugExists(slug: string): Promise<boolean>;
}
