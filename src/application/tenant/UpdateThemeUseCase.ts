import type { ITenantRepository, TenantRecord } from '@/domain/tenant/ITenantRepository';
import { Result } from '@/domain/shared/Result';
import { TenantNotFoundError, ThemeValidationError } from '@/domain/shared/DomainError';

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
const FONT_FAMILIES = ['sans', 'serif', 'mono'] as const;
const BORDER_RADII = ['sm', 'md', 'lg'] as const;

export interface UpdateThemeDTO {
  tenantId: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: 'sans' | 'serif' | 'mono';
  borderRadius?: 'sm' | 'md' | 'lg';
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

function validateHex(value: string): boolean {
  return HEX_REGEX.test(value);
}

/**
 * Valida e persiste tema do tenant. Invalida cache Redis via callback (slug) injetado.
 */
export class UpdateThemeUseCase {
  constructor(
    private readonly tenantRepo: ITenantRepository,
    private readonly invalidateTenantCacheBySlug: (slug: string) => Promise<void>
  ) {}

  async execute(
    dto: UpdateThemeDTO
  ): Promise<Result<TenantRecord, TenantNotFoundError | ThemeValidationError>> {
    if (dto.primaryColor !== undefined && !validateHex(dto.primaryColor)) {
      return Result.fail(
        new ThemeValidationError(
          `primaryColor inválido: deve ser hex (#RRGGBB), recebido: ${dto.primaryColor}`
        )
      );
    }
    if (dto.secondaryColor !== undefined && !validateHex(dto.secondaryColor)) {
      return Result.fail(
        new ThemeValidationError(
          `secondaryColor inválido: deve ser hex (#RRGGBB), recebido: ${dto.secondaryColor}`
        )
      );
    }
    if (dto.fontFamily !== undefined && !FONT_FAMILIES.includes(dto.fontFamily)) {
      return Result.fail(
        new ThemeValidationError(
          `fontFamily inválido: deve ser um de ${FONT_FAMILIES.join(', ')}, recebido: ${dto.fontFamily}`
        )
      );
    }
    if (dto.borderRadius !== undefined && !BORDER_RADII.includes(dto.borderRadius)) {
      return Result.fail(
        new ThemeValidationError(
          `borderRadius inválido: deve ser um de ${BORDER_RADII.join(', ')}, recebido: ${dto.borderRadius}`
        )
      );
    }

    const tenant = await this.tenantRepo.findById(dto.tenantId);
    if (!tenant) {
      return Result.fail(new TenantNotFoundError(dto.tenantId));
    }

    const updated = await this.tenantRepo.updateTheme(dto.tenantId, {
      primaryColor: dto.primaryColor,
      secondaryColor: dto.secondaryColor,
      fontFamily: dto.fontFamily,
      borderRadius: dto.borderRadius,
      logoUrl: dto.logoUrl,
      faviconUrl: dto.faviconUrl,
    });

    await this.invalidateTenantCacheBySlug(tenant.slug);

    return Result.ok(updated);
  }
}
