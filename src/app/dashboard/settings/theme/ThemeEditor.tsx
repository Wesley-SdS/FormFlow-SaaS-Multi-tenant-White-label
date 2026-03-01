'use client';

import { useState, useEffect, useCallback } from 'react';

interface ThemeState {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  borderRadius: 'sm' | 'md' | 'lg';
  logoUrl: string | null;
  faviconUrl: string | null;
}

const FONTS: { value: 'sans' | 'serif' | 'mono'; label: string }[] = [
  { value: 'sans', label: 'Sans-serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Monospace' },
];

const RADII: { value: 'sm' | 'md' | 'lg'; label: string }[] = [
  { value: 'sm', label: 'Pequeno' },
  { value: 'md', label: 'Médio' },
  { value: 'lg', label: 'Grande' },
];

const DEFAULT_THEME: ThemeState = {
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  fontFamily: 'sans',
  borderRadius: 'md',
  logoUrl: null,
  faviconUrl: null,
};

export function ThemeEditor() {
  const [theme, setTheme] = useState<ThemeState>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fetchTheme = useCallback(async () => {
    try {
      const res = await fetch('/api/tenant/theme', { method: 'GET', credentials: 'same-origin' });
      if (res.ok) {
        const data = (await res.json()) as { theme?: Partial<ThemeState> };
        if (data.theme) {
          setTheme((prev) => ({ ...prev, ...data.theme }));
        }
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? `Erro ao carregar tema (${res.status})`);
      }
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const saveTheme = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch('/api/tenant/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(theme),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erro ao salvar');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-2 text-sm text-zinc-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
        Carregando tema...
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg
            className="h-4 w-4 shrink-0"
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
      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Tema salvo com sucesso.
        </div>
      )}

      {/* Two-column layout: settings + preview */}
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        {/* Settings */}
        <div className="space-y-5">
          {/* Colors */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Cores</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <ColorPicker
                label="Cor primária"
                value={theme.primaryColor}
                onChange={(v) => setTheme((t) => ({ ...t, primaryColor: v }))}
              />
              <ColorPicker
                label="Cor secundária"
                value={theme.secondaryColor}
                onChange={(v) => setTheme((t) => ({ ...t, secondaryColor: v }))}
              />
            </div>
          </section>

          {/* Typography & Radius */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Tipografia e bordas</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Fonte</label>
                <div className="flex gap-2">
                  {FONTS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setTheme((t) => ({ ...t, fontFamily: f.value }))}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        theme.fontFamily === f.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Borda</label>
                <div className="flex gap-2">
                  {RADII.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setTheme((t) => ({ ...t, borderRadius: r.value }))}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        theme.borderRadius === r.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveTheme}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Salvando...
                </>
              ) : (
                'Salvar tema'
              )}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:sticky xl:top-20 xl:self-start">
          <h2 className="text-sm font-semibold text-zinc-900">Preview</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Atualize a página após salvar para aplicar.
          </p>
          <div
            className="mt-4 space-y-4 rounded-xl border border-zinc-100 p-5"
            style={{
              ['--ff-primary' as string]: theme.primaryColor,
              ['--ff-secondary' as string]: theme.secondaryColor,
              fontFamily:
                theme.fontFamily === 'sans'
                  ? 'system-ui, sans-serif'
                  : theme.fontFamily === 'serif'
                    ? 'Georgia, serif'
                    : 'ui-monospace, monospace',
              backgroundColor: '#f8f9fb',
            }}
          >
            {/* Mini header */}
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
              <div
                className="flex h-6 w-6 items-center justify-center text-[10px] font-bold text-white"
                style={{
                  backgroundColor: theme.primaryColor,
                  borderRadius:
                    theme.borderRadius === 'sm'
                      ? '0.25rem'
                      : theme.borderRadius === 'md'
                        ? '0.375rem'
                        : '0.5rem',
                }}
              >
                F
              </div>
              <span className="text-xs font-semibold text-zinc-700">FormFlow</span>
            </div>

            {/* Mini card */}
            <div
              className="rounded-lg bg-white p-4 shadow-sm"
              style={{
                borderRadius:
                  theme.borderRadius === 'sm'
                    ? '0.5rem'
                    : theme.borderRadius === 'md'
                      ? '0.75rem'
                      : '1rem',
              }}
            >
              <p className="text-xs font-medium text-zinc-700">Meu formulário</p>
              <p className="mt-1 text-[11px]" style={{ color: theme.secondaryColor }}>
                12 respostas coletadas
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-[11px] font-medium text-white"
                  style={{
                    backgroundColor: theme.primaryColor,
                    borderRadius:
                      theme.borderRadius === 'sm'
                        ? '0.25rem'
                        : theme.borderRadius === 'md'
                          ? '0.375rem'
                          : '0.5rem',
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="border px-3 py-1.5 text-[11px] font-medium text-zinc-600"
                  style={{
                    borderColor: '#e4e4e7',
                    borderRadius:
                      theme.borderRadius === 'sm'
                        ? '0.25rem'
                        : theme.borderRadius === 'md'
                          ? '0.375rem'
                          : '0.5rem',
                  }}
                >
                  Ver respostas
                </button>
              </div>
            </div>

            {/* Mini input */}
            <div
              className="rounded-lg bg-white p-4 shadow-sm"
              style={{
                borderRadius:
                  theme.borderRadius === 'sm'
                    ? '0.5rem'
                    : theme.borderRadius === 'md'
                      ? '0.75rem'
                      : '1rem',
              }}
            >
              <p className="text-xs font-medium text-zinc-700">Seu nome</p>
              <div
                className="mt-1.5 border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] text-zinc-400"
                style={{
                  borderRadius:
                    theme.borderRadius === 'sm'
                      ? '0.25rem'
                      : theme.borderRadius === 'md'
                        ? '0.375rem'
                        : '0.5rem',
                }}
              >
                Digite aqui...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `color-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-zinc-500">{label}</p>
      <div className="flex items-center gap-2.5">
        {/*
         * Usar <label htmlFor> garante que clicar no swatch abre o color picker nativo,
         * sem depender de posicionamento absoluto ou opacity-0 que pode ser bloqueado
         * por elementos sobrepostos.
         */}
        <label
          htmlFor={id}
          className="block h-9 w-9 cursor-pointer rounded-lg border-2 border-white shadow-md ring-1 ring-zinc-200 transition-transform hover:scale-105"
          style={{ backgroundColor: value }}
          title="Clique para escolher a cor"
        />
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          className="block w-24 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 font-mono text-xs text-zinc-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}
