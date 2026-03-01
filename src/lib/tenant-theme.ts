import { prisma } from '@/infrastructure/db/prisma.client';

export interface TenantThemeData {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  borderRadius: 'sm' | 'md' | 'lg';
  logoUrl: string | null;
  faviconUrl: string | null;
}

const DEFAULT_THEME: TenantThemeData = {
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  fontFamily: 'sans',
  borderRadius: 'md',
  logoUrl: null,
  faviconUrl: null,
};

/**
 * Busca tema do tenant no servidor (para ThemeProvider server-side).
 * Retorna tema padrão se tenantId ausente ou tenant não encontrado.
 */
export async function getTenantTheme(tenantId: string | null): Promise<TenantThemeData> {
  if (!tenantId) return DEFAULT_THEME;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        primaryColor: true,
        secondaryColor: true,
        fontFamily: true,
        borderRadius: true,
        logoUrl: true,
        faviconUrl: true,
      },
    });
    if (!tenant) return DEFAULT_THEME;
    return {
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      fontFamily: tenant.fontFamily as 'sans' | 'serif' | 'mono',
      borderRadius: tenant.borderRadius as 'sm' | 'md' | 'lg',
      logoUrl: tenant.logoUrl,
      faviconUrl: tenant.faviconUrl,
    };
  } catch {
    return DEFAULT_THEME;
  }
}

const FONT_MAP: Record<string, string> = {
  sans: 'var(--font-sans, system-ui, sans-serif)',
  serif: 'Georgia, serif',
  mono: 'ui-monospace, monospace',
};

const RADIUS_MAP: Record<string, string> = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
};

/**
 * Gera o bloco CSS :root com variáveis do tema (zero FOUC quando injetado no head).
 */
export function themeToCssVariables(theme: TenantThemeData): string {
  return `
:root {
  --ff-primary: ${theme.primaryColor};
  --ff-secondary: ${theme.secondaryColor};
  --ff-font-family: ${FONT_MAP[theme.fontFamily] ?? FONT_MAP.sans};
  --ff-radius: ${RADIUS_MAP[theme.borderRadius] ?? RADIUS_MAP.md};
}`.trim();
}
