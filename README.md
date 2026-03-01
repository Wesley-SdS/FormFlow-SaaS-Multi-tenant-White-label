# 📋 FormFlow

> **FormFlow** — Uma plataforma SaaS multi-tenant e white-label para criação, gestão e análise de formulários de forma elegante e segura.

[![Next.js](https://img.shields.io/badge/Next.js-15+-000000?style=flat-square&logo=nextjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19+-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4+-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-6+-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)

---

## ✨ Destaques

- 🏢 **Multi-tenant** com isolamento completo de dados via RLS (Row Level Security)
- 🎨 **White-label** pronto para customização de branding
- 🔒 **Segurança em primeiro lugar** com autenticação e autorização robustas
- ⚡ **Performance otimizada** com Server Components e cache inteligente
- 🗄️ **PostgreSQL + Prisma** com migrações versionadas
- 🧪 **Testabilidade** com Vitest e testes bem estruturados
- 📦 **Type-safe** com TypeScript strict e Zod para validação
- 🚀 **Escalável** pronto para crescimento horizontal

---

## 🛠️ Stack Tecnológico

### Frontend

- **[Next.js 15+](https://nextjs.org)** — App Router, Server Components, API Routes
- **[React 19](https://react.dev)** — UI moderna e reativa
- **[Tailwind CSS v4](https://tailwindcss.com)** — Styling utilitário com PostCSS e `@theme`
- **[TypeScript](https://www.typescriptlang.org)** — Type-safety em todo código

### Backend & Banco de Dados

- **[PostgreSQL](https://www.postgresql.org)** — Banco de dados relacional robusto
- **[Prisma 6](https://www.prisma.io)** — ORM type-safe com migrações automáticas
- **[Row Level Security (RLS)](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)** — Isolamento de dados por tenant
- **[Supabase](https://supabase.com)** — Backend integrado (autenticação, realtime)

### Validação & Qualidade

- **[Zod](https://zod.dev)** — Validação de tipos em runtime (env, APIs, schemas)
- **[ESLint](https://eslint.org)** — Linting configurável
- **[Prettier](https://prettier.io)** — Formatação automática
- **[Husky](https://typicode.github.io/husky)** — Git hooks
- **[Vitest](https://vitest.dev)** — Testes unitários e integração

### Cache & Performance

- **[Redis/IORedis](https://github.com/luin/ioredis)** — Cache distribuído (opcional)

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** `>= 20.9`
- **npm** ou **yarn**
- **PostgreSQL** `>= 14`
- **(Opcional) Redis** para cache de tenant

```bash
# Verificar versões
node --version    # v20.9.0+
npm --version     # 10.0.0+
psql --version    # PostgreSQL 14+
```

---

---

## 🚀 Guia de Instalação

### 0️⃣ Ambiente local com Docker (recomendado)

Subir PostgreSQL e Redis com um comando:

```bash
# Subir os serviços em background
docker compose up -d

# Aguardar os serviços ficarem saudáveis (alguns segundos), depois:
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

O `.env` já está configurado para usar `postgresql://formflow:formflow@localhost:5432/formflow` e `redis://localhost:6379`.

O `.env` já inclui `DEV_TENANT_ID` com o UUID fixo do tenant de dev (`tenant-a`). Se você rodar o seed do zero (`pnpm db:reset`), esse tenant é criado com esse ID e o localhost funciona sem 404.

```bash
# Parar os containers
docker compose down
```

---

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/Wesley-SdS/FormFlow-SaaS-Multi-tenant-White-label.git
cd FormFlow-SaaS-Multi-tenant-White-label
```

### 2️⃣ Instalar Dependências

```bash
npm install

# Se encontrar problemas com esbuild no Windows:
npm install --ignore-scripts
```

### 3️⃣ Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env
```

Editar `.env` com suas credenciais. **Se usar Docker Compose**, o `.env` já vem com os valores corretos; só falta preencher `DEV_TENANT_ID` após o seed (ver seção "Ambiente local com Docker" acima).

```bash
# Banco (com Docker: formflow:formflow@localhost:5432/formflow)
DATABASE_URL="postgresql://formflow:formflow@localhost:5432/formflow"

# Redis (com Docker: localhost:6379)
REDIS_URL="redis://localhost:6379"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Dev: preencher DEV_TENANT_ID após db:seed (tenant com slug tenant-a)
DEV_TENANT_ID=""
DEV_TENANT_SLUG="tenant-a"
```

### 4️⃣ Configurar Banco de Dados

```bash
# Gerar Prisma Client
npm run db:generate

# Criar tabelas e executar migrações
npm run db:migrate -- --name init

# Aplicar políticas RLS (security essencial!)
psql $DATABASE_URL -f prisma/rls.policies.sql

# Seed (criar dados de exemplo)
npm run db:seed
```

### 5️⃣ Iniciar Desenvolvimento

```bash
npm run dev
```

Abrir [localhost:3000](http://localhost:3000) no navegador.

---

## 📚 Scripts Disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | 🚀 Inicia servidor de desenvolvimento |
| `npm run build` | 📦 Build otimizado para produção |
| `npm start` | ▶️ Executa build de produção |
| `npm run lint` | 🔍 Valida código com ESLint |
| `npm run format` | ✨ Formata código com Prettier |
| `npm run format:check` | 📋 Verifica formatação |
| `npm run typecheck` | 🔐 Valida tipos TypeScript |
| `npm run test` | 🧪 Executa testes em watch mode |
| `npm run test:run` | ✅ Executa testes uma única vez |
| `npm run db:generate` | 🔧 Gera Prisma Client |
| `npm run db:push` | 🔄 Sincroniza schema (prototiping) |
| `npm run db:migrate` | 📝 Cria nova migração |
| `npm run db:seed` | 🌱 Popula banco com dados de teste |
| `npm run db:studio` | 🎨 Abre Prisma Studio (GUI) |
| `npm run db:reset` | 🔄 Reset completo do banco + migrations + seed (uso: `pnpm db:reset`) |

---

## 📁 Estrutura do Projeto

```text
FormFlow/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Layout raiz
│   │   ├── page.tsx                  # Home page
│   │   ├── globals.css               # Estilos globais
│   │   └── 404/
│   │       └── page.tsx              # Página 404
│   │
│   ├── lib/                          # Utilitários e helpers
│   │   ├── env.ts                    # Variáveis de ambiente (Zod validado)
│   │   ├── tenant-resolver.ts        # Resolução de tenant por hostname
│   │   ├── auth.ts                   # Autenticação (stub)
│   │   └── permissions.ts            # Permissões e RBAC (stub)
│   │
│   ├── infrastructure/               # Camada de infraestrutura
│   │   └── db/
│   │       ├── prisma.client.ts      # Singleton do Prisma Client
│   │       └── withTenantContext.ts  # Middleware para contexto de tenant
│   │
│   └── middleware.ts                 # Middleware Next.js
│
├── prisma/
│   ├── schema.prisma                 # Schema do banco (Prisma)
│   ├── migrations/                   # Histórico de migrações
│   ├── rls.policies.sql              # Políticas de segurança (PostgreSQL RLS)
│   └── seed.ts                       # Script de seed
│
├── docs/
│   ├── SPRINT_1.md                   # Checklist da primeira sprint
│   └── requirements.md               # Requisitos completos do projeto
│
├── .env.example                      # Arquivo de exemplo de variáveis
├── package.json                      # Dependências e scripts
├── tsconfig.json                     # Configuração TypeScript
├── tailwind.config.ts                # Configuração Tailwind CSS v4
├── postcss.config.js                 # Configuração PostCSS
├── eslint.config.js                  # Configuração ESLint
├── prettier.config.js                # Configuração Prettier
├── vitest.config.ts                  # Configuração Vitest
└── README.md                         # Este arquivo
```

---

## 🏗️ Arquitetura & Conceitos

### Multi-tenant com RLS

O FormFlow implementa isolamento de dados completo através de:

1. **Tenant Resolver** — Identifica tenant por hostname ou header
2. **Middleware** — Injeta contexto de tenant antes de processar requisição
3. **PostgreSQL RLS** — Políticas de segurança garantem isolamento no nível do banco
4. **Prisma Context** — Todas queries incluem filtro de `tenant_id`

```text
[Request]
    → Middleware (x-tenant-id, x-tenant-slug)
    → TenantResolver
    → RLS Policies
    → Dados isolados ✅
```

### Banco de Dados

O schema está estruturado para escalabilidade:

```text
Tenants
├── TenantMembers (usuários do tenant)
├── Subscriptions (plano atual, status)
└── Forms (futuro)

Users
├── Email única globalmente
└── TenantMembers (vincula user a tenant + role)

Plans
├── Starter, Growth, Business
└── Integração com Stripe

Subscriptions
├── Status (trial, active, canceled)
└── Período de cobrança
```

**Segurança:**

- Todas as tabelas possuem `tenant_id`
- RLS policies garantem que usuários só acessam dados do seu tenant
- Foreign keys com `onDelete: Cascade` para integridade

### Autenticação & Autorização (Stubs)

Arquivos preparados para integração:

- `src/lib/auth.ts` — Login, JWT, sessões
- `src/lib/permissions.ts` — RBAC com roles (owner, admin, editor, viewer)

---

## 🔒 Segurança

### RLS (Row Level Security)

Arquivo `prisma/rls.policies.sql` contém:

```sql
-- Exemplo: usuários só veem tenants aonde são membros
CREATE POLICY "users_see_own_tenants"
  ON "public"."tenants"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = tenants.id
        AND user_id = current_user_id()
    )
  );
```

### Boas Práticas Implementadas

- ✅ TypeScript strict mode
- ✅ Validação com Zod (env, inputs)
- ✅ Prepared statements (Prisma)
- ✅ Isolamento de tenant com RLS
- ✅ Linting com ESLint
- ✅ Git hooks com Husky

---

## 🧪 Testes

```bash
# Modo watch
npm run test

# Executar uma única vez
npm run test:run

# Com cobertura
npm run test:run -- --coverage
```

Estrutura de testes:

```text
src/
├── **/__tests__/        # Testes colocados próximos ao código
│   └── *.test.ts
└── ...
```

---

## 📊 Desenvolvimento & Debugging

### Prisma Studio (GUI)

Visualizar e editar dados do banco com interface gráfica:

```bash
npm run db:studio
```

### Variáveis de Debug

No `.env`:

```bash
# Debug Prisma
DEBUG=prisma:*

# Debug Next.js
DEBUG=next:*
```

### VSCode Extensions Recomendadas

- **Prisma** — Syntax highlighting, autocomplete
- **Tailwind CSS IntelliSense** — Autocomplete Tailwind
- **TypeScript Vue Plugin** — Type checking
- **ESLint** — Linting em tempo real

---

## 🚢 Deploy

### Vercel (Recomendado)

```bash
# 1. Push para GitHub
git push origin main

# 2. Importar projeto em vercel.com
# - Conectar repositório
# - Adicionar variáveis de ambiente (.env)
# - Deploy automático em push

# 3. Rodar migrações (one-time)
npm run db:migrate -- --name init
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📖 Documentação Adicional

- **[Sprint 1 Checklist](docs/SPRINT_1.md)** — Features implementadas e roadmap
- **[Requisitos Completos](docs/requirements.md)** — Funcionalidades detalhadas
- **Prisma Docs** — Documentação ORM
- **Next.js Docs** — Framework
- **Tailwind CSS Docs** — Styling

---

## 🤝 Contribuindo

1. **Fork** o repositório
2. **Crie uma branch** (`git checkout -b feature/sua-feature`)
3. **Commit suas mudanças** (`git commit -m 'Add: nova feature'`)
4. **Push para branch** (`git push origin feature/sua-feature`)
5. **Abra um Pull Request**

### Padrões de Código

- ESLint valida automaticamente em commit (Husky)
- Prettier formata código automaticamente
- TypeScript strict mode obrigatório

```bash
# Antes de fazer push
npm run lint
npm run typecheck
npm run test:run
```

---

## 📝 Convenções

### Commits

```text
feat: adicionar nova feature
fix: corrigir bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: tarefas de build/deploy
```

### Branches

- `main` — Produção
- `develop` — Desenvolvimento
- `feature/*` — Novas features
- `fix/*` — Bug fixes
- `docs/*` — Documentação

---

---

## 📞 Suporte & Contato

- **Issues** — GitHub Issues
- **Email** — wesleysds@seu-dominio.com
- **Documentação** — Veja pasta `/docs`

---

## 📄 Licença

Privado — Todos os direitos reservados © 2025

---

Feito com ❤️ por Wesley SdS

⭐ Se gostar do projeto, considere dar uma estrela!
