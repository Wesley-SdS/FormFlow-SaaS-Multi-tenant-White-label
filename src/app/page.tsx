import Link from 'next/link';

export default function HomePage() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: 'linear-gradient(135deg, #09090f 0%, #120a2e 50%, #0d0920 100%)' }}
    >
      {/* Top nav */}
      <header
        className="flex h-16 items-center justify-between px-8"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            <span className="text-sm font-bold text-white">F</span>
          </div>
          <span className="text-[15px] font-semibold text-white">FormFlow</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm font-medium text-white/60 hover:text-white transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            Criar conta
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        {/* Glow effect */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }}
          aria-hidden
        />

        <div className="relative">
          {/* Badge */}
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white/70"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
            }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
            SaaS Multi-tenant · White-label
          </div>

          {/* Heading */}
          <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Formulários com a
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #a78bfa, #c084fc, #e879f9)' }}
            >
              identidade da sua marca
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/50">
            Crie formulários personalizados com subdomínio próprio, tema white-label e onboarding
            guiado. Pronto em minutos, escala para empresas.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-violet-500/25"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
            >
              Começar gratuitamente →
            </Link>
            <Link
              href="/login"
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white/70 transition-all hover:text-white"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="relative mt-20 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            { icon: '◈', title: 'White-label completo', desc: 'Logo, cores e fonte da sua marca' },
            { icon: '◎', title: 'Subdomínio próprio', desc: 'seu-negocio.formflow.app' },
            { icon: '⬡', title: 'Multi-tenant', desc: 'Isolamento total de dados' },
          ].map((feat) => (
            <div
              key={feat.title}
              className="rounded-2xl p-5 text-left transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span className="text-xl text-violet-400">{feat.icon}</span>
              <p className="mt-3 text-sm font-semibold text-white">{feat.title}</p>
              <p className="mt-1 text-xs text-white/40">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-5 text-center text-xs text-white/20"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        © {new Date().getFullYear()} FormFlow · Todos os direitos reservados
      </footer>
    </div>
  );
}
