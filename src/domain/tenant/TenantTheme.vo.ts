/**
 * Value Object: tema white-label do tenant.
 * Validação de formato (hex, enum) é feita via Zod no Use Case; aqui apenas o contrato.
 */
export type ThemeFontFamily = 'sans' | 'serif' | 'mono';
export type ThemeBorderRadius = 'sm' | 'md' | 'lg';

export interface TenantThemeProps {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: ThemeFontFamily;
  borderRadius: ThemeBorderRadius;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

export class TenantThemeVO {
  private constructor(private readonly props: TenantThemeProps) {}

  static from(props: TenantThemeProps): TenantThemeVO {
    return new TenantThemeVO({ ...props });
  }

  get primaryColor(): string {
    return this.props.primaryColor;
  }

  get secondaryColor(): string {
    return this.props.secondaryColor;
  }

  get fontFamily(): ThemeFontFamily {
    return this.props.fontFamily;
  }

  get borderRadius(): ThemeBorderRadius {
    return this.props.borderRadius;
  }

  get logoUrl(): string | null {
    return this.props.logoUrl ?? null;
  }

  get faviconUrl(): string | null {
    return this.props.faviconUrl ?? null;
  }

  toPlain(): TenantThemeProps {
    return { ...this.props };
  }
}
