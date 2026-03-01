import { getTenantTheme, themeToCssVariables } from '@/lib/tenant-theme';

interface ThemeProviderProps {
  tenantId: string | null;
  children: React.ReactNode;
}

/**
 * Server Component: busca tema do tenant e injeta CSS variables no head.
 * Zero FOUC — estilos aplicados antes do primeiro paint.
 */
export async function ThemeProvider({ tenantId, children }: ThemeProviderProps) {
  const theme = await getTenantTheme(tenantId);
  const cssVars = themeToCssVariables(theme);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: cssVars,
        }}
      />
      {theme.faviconUrl && <link rel="icon" href={theme.faviconUrl} />}
      {children}
    </>
  );
}
