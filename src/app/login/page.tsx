import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Entrar — FormFlow',
  description: 'Acesse sua conta FormFlow',
};

export default function LoginPage() {
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

        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-white">Bem-vindo de volta.</h2>
          <p className="text-sm leading-relaxed text-white/50">
            Acesse seu painel, acompanhe as respostas e gerencie o tema white-label do seu negócio.
          </p>

          <div
            className="h-px w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)',
            }}
          />
        </div>

        <p className="text-xs text-white/30">
          Não tem conta?{' '}
          <Link href="/signup" className="font-medium text-violet-400 hover:text-violet-300">
            Criar conta grátis
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
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Entrar</h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Use o e-mail cadastrado para acessar sua conta.
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-zinc-500 lg:hidden">
            Não tem conta?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
