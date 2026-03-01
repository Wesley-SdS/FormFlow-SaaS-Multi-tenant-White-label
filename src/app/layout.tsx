import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FormFlow',
  description: 'SaaS Multi-tenant White-label — Formulários',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-white text-zinc-900">
        {children}
      </body>
    </html>
  );
}
