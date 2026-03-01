# Sprint 1 — Checklist de validação manual

## Entregáveis

- [ ] Repositório configurado e CI verde
- [ ] Banco com RLS funcionando (validado pelo seed)
- [ ] Proxy/Middleware resolvendo tenant por hostname
- [ ] Tailwind v4 configurado (PostCSS + `@import "tailwindcss"`)
- [ ] Variáveis de ambiente validadas com Zod (`src/lib/env.ts`)

## Pré-requisitos

- Node.js 20.9+
- TypeScript 5.1+
- PostgreSQL
- (Opcional) Redis para cache de tenant no middleware

## Comandos

```bash
# Instalar dependências
npm install

# Copiar env e preencher
cp .env.example .env

# Gerar Prisma Client
npm run db:generate

# Primeira migração (cria tabelas)
npm run db:migrate -- --name init

# Aplicar políticas RLS (após primeira migração)
psql $DATABASE_URL -f prisma/rls.policies.sql

# Seed (2 tenants, 6 usuários)
npm run db:seed

# Dev
npm run dev
```

Para testar o tenant em localhost sem Redis, defina no `.env`:

- `DEV_TENANT_ID` = id de um tenant (ex.: do seed)
- `DEV_TENANT_SLUG` = slug (ex.: `tenant-a`)

## Validação RLS

1. Conectar ao banco e executar `SET app.tenant_id = '<tenant_1_id>';`
2. Listar `tenant_members` — deve retornar apenas do tenant 1.
3. Executar `SET app.tenant_id = '<tenant_2_id>';` e listar de novo — apenas tenant 2.

## Next.js 16

Quando migrar para Next.js 16: renomear `src/middleware.ts` para `src/proxy.ts` e a função exportada de `middleware` para `proxy`.
