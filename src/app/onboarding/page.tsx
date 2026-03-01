import type { Metadata } from 'next';
import Link from 'next/link';
import { OnboardingWizard } from './OnboardingWizard';

export const metadata: Metadata = {
  title: 'Configuração — FormFlow',
  description: 'Configure sua conta em 3 passos',
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f5f4ff' }}>
      {/* Top bar */}
      <header
        className="flex h-14 items-center justify-between px-6"
        style={{
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(124,58,237,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            <span className="text-xs font-bold text-white">F</span>
          </div>
          <span className="text-sm font-semibold text-zinc-900">FormFlow</span>
        </Link>
        <span className="rounded-full bg-violet-100 px-3 py-0.5 text-xs font-medium text-violet-700">
          Configuração inicial
        </span>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Bem-vindo ao FormFlow!
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Conclua os passos abaixo para configurar sua conta e começar a usar.
          </p>
        </div>
        <OnboardingWizard />
      </main>
    </div>
  );
}
