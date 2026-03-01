# FormFlow

SaaS Multi-tenant White-label — criação e gestão de formulários.

## Stack

- **Next.js 15+** (App Router, Server Components)
- **Tailwind CSS v4** (PostCSS, `@theme` no CSS)
- **PostgreSQL** + Prisma + RLS (Row Level Security)
- **TypeScript** strict
- **Zod** para validação (env, APIs)

## Pré-requisitos

- Node.js 20.9+
- PostgreSQL
- (Opcional) Redis para cache de tenant no middleware

## Setup

```bash
# Instalar dependências (se falhar no Windows por causa do esbuild, tente: npm install --ignore-scripts)
npm install

# Copiar variáveis de ambiente
cp .env.example .env
# Editar .env: DATABASE_URL, e opcionalmente DEV_TENANT_ID / DEV_TENANT_SLUG para dev em localhost

# Gerar Prisma Client
npm run db:generate

# Criar tabelas (primeira migração)
npm run db:migrate -- --name init

# Aplicar políticas RLS (executar após a migração)
psql $DATABASE_URL -f prisma/rls.policies.sql

# Seed (2 tenants, 6 usuários)
npm run db:seed
```

## Scripts

| Comando        | Descrição                    |
|----------------|------------------------------|
| `npm run dev`  | Servidor de desenvolvimento  |
| `npm run build`| Build de produção            |
| `npm run lint` | ESLint                       |
| `npm run typecheck` | Verificação TypeScript |
| `npm run test:run`  | Testes (Vitest)        |
| `npm run db:studio` | Prisma Studio          |

## Estrutura (Sprint 1)

- `src/app` — App Router (páginas, layout)
- `src/lib` — env (Zod), tenant-resolver, auth (stub), permissions (stub)
- `src/infrastructure/db` — Prisma client, withTenantContext
- `src/middleware.ts` — Resolução de tenant por hostname (headers `x-tenant-id`, `x-tenant-slug`)
- `prisma` — Schema, seed, `rls.policies.sql`

## Documentação

- [Sprint 1 — Checklist](docs/SPRINT_1.md)
- [Requisitos completos](docs/requirements.md) (copiar de formflow-requirements.md para `docs/requirements.md`)

## Licença

Privado.
