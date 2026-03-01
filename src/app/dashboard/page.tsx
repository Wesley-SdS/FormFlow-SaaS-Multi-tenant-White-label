import { headers } from 'next/headers';

const STATS = [
  { label: 'Formulários', value: '0', change: 'Nenhum criado', icon: 'doc', color: '#7c3aed' },
  { label: 'Respostas', value: '0', change: 'Aguardando', icon: 'chart', color: '#a855f7' },
  {
    label: 'Taxa de conclusão',
    value: '—',
    change: 'Sem dados',
    icon: 'percent',
    color: '#c084fc',
  },
  { label: 'Membros', value: '1', change: 'Ativo', icon: 'users', color: '#7c3aed' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  doc: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  ),
  chart: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  ),
  percent: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
      />
    </svg>
  ),
  users: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  ),
};

export default async function DashboardPage() {
  const hdrs = await headers();
  const tenantSlug = hdrs.get('x-tenant-slug') ?? 'seu espaço';

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Bem-vindo de volta</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Visão geral do espaço{' '}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}
          >
            {tenantSlug}
          </span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md"
            style={{
              borderColor: 'rgba(124,58,237,0.1)',
              boxShadow: '0 1px 3px rgba(124,58,237,0.05)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-zinc-500">{stat.label}</span>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `${stat.color}15`, color: stat.color }}
              >
                {ICON_MAP[stat.icon]}
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">{stat.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div
        className="rounded-2xl border bg-white p-6"
        style={{
          borderColor: 'rgba(124,58,237,0.1)',
          boxShadow: '0 1px 3px rgba(124,58,237,0.05)',
        }}
      >
        <h2 className="text-sm font-semibold text-zinc-900">Primeiros passos</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Configure seu espaço para começar a coletar respostas.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <a
            href="/dashboard/settings/theme"
            className="group flex items-center gap-3 rounded-xl border p-4 transition-all hover:scale-[1.02]"
            style={{ borderColor: 'rgba(124,58,237,0.15)', background: 'rgba(124,58,237,0.03)' }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}
            >
              <svg
                className="h-5 w-5"
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
            </div>
            <div>
              <p className="text-[13px] font-semibold text-zinc-800 group-hover:text-violet-700">
                Personalizar tema
              </p>
              <p className="text-xs text-zinc-400">Cores, fonte e logo</p>
            </div>
          </a>

          <div className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-200 p-4 opacity-50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-zinc-500">Criar formulário</p>
              <p className="text-xs text-zinc-400">Em breve · Sprint 3</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-200 p-4 opacity-50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
              <svg
                className="h-5 w-5"
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
            </div>
            <div>
              <p className="text-[13px] font-semibold text-zinc-500">Convidar membros</p>
              <p className="text-xs text-zinc-400">Em breve</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
