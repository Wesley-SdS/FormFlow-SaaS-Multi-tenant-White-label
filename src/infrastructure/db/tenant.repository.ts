import type {
  ITenantRepository,
  CreateTenantData,
  TenantRecord,
} from '@/domain/tenant/ITenantRepository';
import { prisma } from './prisma.client';
import { ThemeFontFamily as PrismaFont, ThemeBorderRadius as PrismaRadius } from '@prisma/client';

function toPrismaFont(f: 'sans' | 'serif' | 'mono'): PrismaFont {
  return f as PrismaFont;
}
function toPrismaRadius(r: 'sm' | 'md' | 'lg'): PrismaRadius {
  return r as PrismaRadius;
}

function mapToRecord(row: {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: PrismaFont;
  borderRadius: PrismaRadius;
  logoUrl: string | null;
  faviconUrl: string | null;
  onboardingStep: number;
  onboardingDoneAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): TenantRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    fontFamily: row.fontFamily,
    borderRadius: row.borderRadius,
    logoUrl: row.logoUrl,
    faviconUrl: row.faviconUrl,
    onboardingStep: row.onboardingStep,
    onboardingDoneAt: row.onboardingDoneAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class TenantRepository implements ITenantRepository {
  async create(data: CreateTenantData): Promise<TenantRecord> {
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        primaryColor: data.primaryColor ?? '#2563eb',
        secondaryColor: data.secondaryColor ?? '#64748b',
        fontFamily: toPrismaFont((data.fontFamily ?? 'sans') as 'sans' | 'serif' | 'mono'),
        borderRadius: toPrismaRadius((data.borderRadius ?? 'md') as 'sm' | 'md' | 'lg'),
      },
    });
    return mapToRecord(tenant);
  }

  async findBySlug(slug: string): Promise<TenantRecord | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });
    return tenant ? mapToRecord(tenant) : null;
  }

  async findById(id: string): Promise<TenantRecord | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });
    return tenant ? mapToRecord(tenant) : null;
  }

  async updateTheme(
    tenantId: string,
    theme: {
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
      borderRadius?: string;
      logoUrl?: string | null;
      faviconUrl?: string | null;
    }
  ): Promise<TenantRecord> {
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(theme.primaryColor !== undefined && { primaryColor: theme.primaryColor }),
        ...(theme.secondaryColor !== undefined && { secondaryColor: theme.secondaryColor }),
        ...(theme.fontFamily !== undefined && {
          fontFamily: toPrismaFont(theme.fontFamily as 'sans' | 'serif' | 'mono'),
        }),
        ...(theme.borderRadius !== undefined && {
          borderRadius: toPrismaRadius(theme.borderRadius as 'sm' | 'md' | 'lg'),
        }),
        ...(theme.logoUrl !== undefined && { logoUrl: theme.logoUrl }),
        ...(theme.faviconUrl !== undefined && { faviconUrl: theme.faviconUrl }),
      },
    });
    return mapToRecord(updated);
  }

  async updateOnboardingStep(tenantId: string, step: number): Promise<void> {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { onboardingStep: step },
    });
  }

  async completeOnboarding(tenantId: string): Promise<void> {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { onboardingDoneAt: new Date(), onboardingStep: 3 },
    });
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await prisma.tenant.count({ where: { slug } });
    return count > 0;
  }
}
