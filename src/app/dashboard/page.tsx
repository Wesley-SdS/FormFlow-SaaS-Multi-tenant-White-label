import { headers } from 'next/headers';
import Link from 'next/link';
import { FormRepository } from '@/infrastructure/db/form.repository';
import { SubmissionRepository } from '@/infrastructure/db/submission.repository';

export default async function DashboardPage() {
  const hdrs = await headers();
  const tenantSlug = hdrs.get('x-tenant-slug') ?? 'seu espaço';
  const tenantId = hdrs.get('x-tenant-id');

  const [stats, formCount, activeForms, dailyCounts] = tenantId
    ? await Promise.all([
        new SubmissionRepository().getStats(tenantId),
        new FormRepository().countByTenant(tenantId),
        new SubmissionRepository().getMostActiveForms(tenantId, 5),
        new SubmissionRepository().getDailyCountsLast30Days(tenantId),
      ])
    : [
        { today: 0, thisWeek: 0, thisMonth: 0, total: 0 },
        0,
        [] as { formId: string; formTitle: string; count: number }[],
        [] as { date: string; count: number }[],
      ];

  const maxDaily = dailyCounts.length > 0 ? Math.max(...dailyCounts.map((d) => d.count), 1) : 1;

  const STATS = [
    {
      label: 'Formulários',
      value: String(formCount),
      change: formCount === 0 ? 'Nenhum criado' : `${formCount} ativo${formCount !== 1 ? 's' : ''}`,
      icon: 'doc',
      color: '#7c3aed',
    },
    {
      label: 'Respostas hoje',
      value: String(stats.today),
      change: `${stats.thisWeek} esta semana`,
      icon: 'chart',
      color: '#a855f7',
    },
    {
      label: 'Respostas este mês',
      value: stats.thisMonth.toLocaleString('pt-BR'),
      change: `${stats.total.toLocaleString('pt-BR')} no total`,
      icon: 'inbox',
      color: '#c084fc',
    },
    {
      label: 'Formulários ativos',
      value: String(activeForms.length > 0 ? activeForms.length : 0),
      change:
        activeForms.length > 0
          ? `${activeForms[0]?.formTitle ?? '—'} lidera`
          : 'Sem respostas ainda',
      icon: 'users',
      color: '#7c3aed',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Bem-vindo de volta</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Visão geral do espaço{' '}
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {tenantSlug}
          </span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-primary/10 bg-white p-5 shadow-[0_1px_3px_rgba(124,58,237,0.05)] transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-zinc-500">{stat.label}</span>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `${stat.color}15`, color: stat.color }}
              >
                <StatIcon icon={stat.icon} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">{stat.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Gráfico de respostas — últimos 30 dias */}
        <div className="lg:col-span-2 rounded-2xl border border-primary/10 bg-white p-5 shadow-[0_1px_3px_rgba(124,58,237,0.05)]">
          <h2 className="text-sm font-semibold text-zinc-900">Respostas — últimos 30 dias</h2>
          {dailyCounts.length === 0 ? (
            <div className="mt-4 flex h-32 items-center justify-center text-sm text-zinc-400">
              Nenhuma resposta no período
            </div>
          ) : (
            <div className="mt-4 flex h-32 items-end gap-1">
              {/* Preenche os 30 dias mesmo sem dados */}
              {getLast30Days().map((d) => {
                const match = dailyCounts.find((dc) => dc.date === d);
                const count = match?.count ?? 0;
                const height = maxDaily > 0 ? Math.round((count / maxDaily) * 100) : 0;
                return (
                  <div
                    key={d}
                    className="group relative flex-1 flex flex-col items-center justify-end"
                  >
                    <div
                      className="w-full min-h-[2px] rounded-t transition-all"
                      style={{
                        height: `${Math.max(height, count > 0 ? 4 : 0)}%`,
                        background: count > 0 ? '#7c3aed' : '#e4e4e7',
                        opacity: count > 0 ? 0.85 : 1,
                      }}
                    />
                    {count > 0 && (
                      <div className="pointer-events-none absolute bottom-full mb-1 hidden rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-white group-hover:block whitespace-nowrap">
                        {d.slice(5)}: {count}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-2 flex justify-between text-xs text-zinc-400">
            <span>30 dias atrás</span>
            <span>Hoje</span>
          </div>
        </div>

        {/* Formulários mais ativos */}
        <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-[0_1px_3px_rgba(124,58,237,0.05)]">
          <h2 className="text-sm font-semibold text-zinc-900">Formulários mais ativos</h2>
          {activeForms.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-zinc-400">Nenhuma resposta ainda</p>
              <Link
                href="/dashboard/forms"
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                Criar formulário
              </Link>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {activeForms.map((f, i) => {
                const max = activeForms[0]?.count ?? 1;
                return (
                  <li key={f.formId}>
                    <Link href={`/dashboard/forms/${f.formId}/submissions`} className="group block">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium text-zinc-700 group-hover:text-primary">
                          {i + 1}. {f.formTitle}
                        </span>
                        <span className="ml-2 flex-shrink-0 text-xs text-zinc-500">{f.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${(f.count / max) * 100}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-primary/10 bg-white p-6 shadow-[0_1px_3px_rgba(124,58,237,0.05)]">
        <h2 className="text-sm font-semibold text-zinc-900">Acesso rápido</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            href="/dashboard/forms/new"
            className="group flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/[0.03] p-4 transition-all hover:scale-[1.02]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
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
              <p className="text-[13px] font-semibold text-zinc-800 group-hover:text-violet-700">
                Criar formulário
              </p>
              <p className="text-xs text-zinc-400">Drag-and-drop builder</p>
            </div>
          </Link>

          <Link
            href="/dashboard/forms"
            className="group flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/[0.03] p-4 transition-all hover:scale-[1.02]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
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
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-zinc-800 group-hover:text-violet-700">
                Meus formulários
              </p>
              <p className="text-xs text-zinc-400">
                {formCount} formulário{formCount !== 1 ? 's' : ''}
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/settings/theme"
            className="group flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/[0.03] p-4 transition-all hover:scale-[1.02]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
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
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
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
    inbox: (
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
          d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
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
  return <>{icons[icon] ?? icons.doc}</>;
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]!);
  }
  return days;
}
