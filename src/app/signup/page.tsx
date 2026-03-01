import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from './SignupForm';

export const metadata: Metadata = {
  title: 'Criar conta — FormFlow',
  description: 'Cadastre sua empresa e comece a usar o FormFlow',
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — dark luxury */}
      <div
        className="hidden w-[440px] shrink-0 flex-col justify-between p-10 lg:flex"
        style={{ background: 'linear-gradient(160deg, #0d0920 0%, #120a2e 60%, #1a0a3b 100%)' }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            <span className="text-sm font-bold text-white">F</span>
          </div>
          <span className="text-[15px] font-semibold text-white">FormFlow</span>
        </Link>

        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">Comece em minutos.</h2>
            <p className="text-sm leading-relaxed text-white/50">
              Configure seu espaço, personalize o tema e publique formulários com a identidade
              visual da sua marca.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              'Subdomínio próprio incluso',
              'Tema white-label configurável',
              'Trial gratuito — sem cartão',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: 'rgba(124,58,237,0.3)',
                    border: '1px solid rgba(167,139,250,0.3)',
                  }}
                >
                  <svg
                    className="h-3 w-3 text-violet-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                {item}
              </li>
            ))}
          </ul>

          {/* Decorative glow */}
          <div
            className="h-px w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)',
            }}
          />
        </div>

        <p className="text-xs text-white/30">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300">
            Entrar
          </Link>
        </p>
      </div>

      {/* Right panel — light */}
      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
            >
              <span className="text-sm font-bold text-white">F</span>
            </div>
            <span className="text-[15px] font-semibold text-zinc-900">FormFlow</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Criar conta</h1>
            <p className="mt-1.5 text-sm text-zinc-500">Preencha os dados abaixo para começar.</p>
          </div>

          <SignupForm />

          <p className="mt-6 text-center text-sm text-zinc-500 lg:hidden">
            Já tem conta?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
