import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { getTenantTheme, themeToCssVariables } from '@/lib/tenant-theme';

export const metadata: Metadata = {
  title: 'FormFlow',
  description: 'SaaS Multi-tenant White-label — Formulários',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');
  const theme = await getTenantTheme(tenantId);
  const cssVars = themeToCssVariables(theme);

  return (
    <html lang="pt-BR">
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {theme.faviconUrl ? <link rel="icon" href={theme.faviconUrl} /> : null}
      </head>
      <body
        className="antialiased min-h-screen bg-white text-zinc-900"
        style={{ fontFamily: 'var(--ff-font-family)' }}
      >
        {children}
      </body>
    </html>
  );
}
