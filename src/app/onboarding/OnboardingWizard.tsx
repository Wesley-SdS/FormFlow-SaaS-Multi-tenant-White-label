'use client';

import { useState, useEffect } from 'react';

interface OnboardingState {
  step: number;
  done: boolean;
}

const STEPS = [
  {
    id: 1,
    title: 'Dados da empresa',
    description: 'Confirme as informações cadastradas.',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
        />
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Configurar tema',
    description: 'Cores, fonte e logo da sua marca.',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
        />
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Convidar membros',
    description: 'Adicione sua equipe (opcional).',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    ),
  },
];

export function OnboardingWizard() {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    fetch('/api/tenant/onboarding', { credentials: 'same-origin' })
      .then(async (res) => {
        if (res.ok) return res.json() as Promise<OnboardingState>;
        const data = (await res.json()) as { error?: string; redirect?: string };
        if (data.redirect) {
          setRedirecting(true);
          window.location.href = data.redirect;
          return null;
        }
        throw new Error(data.error ?? `Erro ${res.status}`);
      })
      .then((data) => {
        if (data) setState(data);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
      })
      .finally(() => setLoading(false));
  }, []);

  const goToStep = async (step: number) => {
    if (state?.done) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/tenant/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ step }),
      });
      const data = (await res.json()) as OnboardingState & { error?: string };
      if (res.ok) {
        setState(data);
      } else {
        setError(data.error ?? `Erro ao salvar (${res.status})`);
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const completeOnboarding = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/tenant/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ step: 3, completed: true }),
      });
      if (res.ok) {
        setState({ step: 3, done: true });
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? `Erro ao concluir (${res.status})`);
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (redirecting || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500" />
          {redirecting ? 'Redirecionando...' : 'Carregando...'}
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <p className="font-medium">Não foi possível carregar o onboarding.</p>
        <p className="mt-1 text-red-600">{error}</p>
        <a href="/signup" className="mt-3 inline-block font-medium underline">
          Fazer cadastro novamente
        </a>
      </div>
    );
  }

  if (state.done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-5 w-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-900">Configuração concluída!</p>
            <p className="text-sm text-emerald-700">Seu espaço está pronto para uso.</p>
          </div>
        </div>
        <a
          href="/dashboard"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Ir para o painel
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </a>
      </div>
    );
  }

  const currentStep = state.step;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <ol className="flex items-center">
          {STEPS.map((s, i) => {
            const isDone = s.id < currentStep;
            const isActive = s.id === currentStep;
            return (
              <li key={s.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                      isDone
                        ? 'border-primary bg-primary text-white'
                        : isActive
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-zinc-200 bg-white text-zinc-400'
                    }`}
                  >
                    {isDone ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    ) : (
                      s.icon
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-medium ${isActive ? 'text-primary' : 'text-zinc-400'}`}
                  >
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-2 mb-5 h-0.5 flex-1 ${isDone ? 'bg-primary' : 'bg-zinc-200'}`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {STEPS[currentStep - 1]?.icon}
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              {STEPS[currentStep - 1]?.title}
            </h2>
            <p className="text-sm text-zinc-500">{STEPS[currentStep - 1]?.description}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-100 pt-5">
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                Os dados da empresa foram definidos no cadastro. Você pode editá-los a qualquer
                momento em Configurações.
              </p>
              <button
                type="button"
                onClick={() => goToStep(2)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving && (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {saving ? 'Salvando...' : 'Próximo'}
                {!saving && (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                )}
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                Personalize as cores e a fonte da sua marca. Você pode editar a qualquer momento em
                Configurações → Tema.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/dashboard/settings/theme"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
                    />
                  </svg>
                  Configurar tema
                </a>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {saving && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                  )}
                  Pular por agora
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                Convidar membros estará disponível em breve. Finalize agora para acessar seu painel.
              </p>
              <button
                type="button"
                onClick={completeOnboarding}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving && (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {saving ? 'Finalizando...' : 'Concluir configuração'}
                {!saving && (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
