# FormFlow — SaaS Multi-tenant White-label
## Documento de Requisitos Técnicos & Sprints

> **Stack:** Next.js 16 · Tailwind CSS v4 · PostgreSQL + RLS · Supabase · TypeScript Strict  
> **Princípios:** SOLID · SRP · Clean Architecture · Domain-Driven Design  
> **Versão:** 1.0 · 6 Sprints · ~12 semanas  
> **Requisitos:** Node.js 20.9+ · TypeScript 5.1+ · React 19.2

---

## Sumário

1. [Visão Geral & Princípios](#1-visão-geral--princípios)
2. [Estrutura de Diretórios](#2-estrutura-de-diretórios)
3. [Sprint 1 — Fundação](#sprint-1--fundação--infra-auth-e-multi-tenant-base)
4. [Sprint 2 — Onboarding & White-label Engine](#sprint-2--onboarding-de-tenant--white-label-engine)
5. [Sprint 3 — Form Builder](#sprint-3--form-builder--crud-schema-e-publicação)
6. [Sprint 4 — Submissions & Dashboard](#sprint-4--submissions-notificações-e-dashboard)
7. [Sprint 5 — Billing & Membros](#sprint-5--billing-planos-e-gestão-de-membros)
8. [Sprint 6 — Hardening & Observabilidade](#sprint-6--observabilidade-segurança-e-hardening)
9. [Instruções para o Cursor AI](#9-instruções-para-o-cursor-ai)

---

## 1. Visão Geral & Princípios

### 1.1 Stack Tecnológica

| ID | Camada | Tecnologia | Justificativa |
|----|--------|-----------|---------------|
| ST-01 | Frontend | Next.js 16 + App Router + Server Components + Turbopack | SSR nativo, cache no edge, proxy (`proxy.ts`) para interceptação de request, Turbopack estável como bundler padrão |
| ST-02 | Estilo | Tailwind CSS v4 + `@tailwindcss/postcss` | Configuração CSS-first (`@theme`), detecção automática de conteúdo, design tokens como variáveis CSS, build mais rápido |
| ST-03 | Linguagem | TypeScript `strict: true`, `noImplicitAny`, `strictNullChecks` (TS 5.1+) | Tipagem forte em todas as camadas |
| ST-04 | Database | PostgreSQL + Row Level Security (RLS) em todas as tabelas | Isolamento de dados por tenant a nível de banco |
| ST-05 | BaaS | Supabase — Auth, Realtime, Storage | Integração nativa com Postgres + RLS |
| ST-06 | ORM | Prisma com migrações versionadas e seeds | Type-safe queries + histórico de schema |
| ST-07 | Pagamentos | Stripe Connect com webhooks idempotentes | Billing multi-tenant, portal de cliente nativo |
| ST-08 | Queue | BullMQ + Redis | Jobs assíncronos: email, provisioning, exports |
| ST-09 | Infra | Vercel — wildcard DNS `*.formflow.app` + Custom Domains API | Deploy serverless + subdomínios dinâmicos |
| ST-10 | Email | Resend + react-email (templates React) | Templates branqueados por tenant |
| ST-11 | Validação | Zod em todas as bordas (API routes, forms, env vars) | Schema-first, erros descritivos |

---

### 1.2 Princípios de Arquitetura

#### Single Responsibility Principle (SRP)
Cada módulo, serviço e componente tem **uma única razão para mudar**.
- Services não fazem validação
- Repositories não têm lógica de negócio
- Componentes UI não fazem fetch direto
- Route handlers só chamam Use Cases e retornam HTTP response

#### Open/Closed Principle (OCP)
O engine de temas é **extensível sem modificar** componentes existentes — adicionar novo campo de customização requer apenas nova config no `TenantTheme` schema.

#### Liskov / Interface Segregation (LSP + ISP)
Repositórios implementam interfaces específicas (`IFormRepository`, `ISubmissionRepository`). Nenhuma classe depende de métodos que não usa.

#### Dependency Inversion (DIP)
Use Cases dependem de **abstrações (interfaces)**, não de implementações concretas. Banco, mailer e queue são injetados — facilitando mock em testes unitários.

---

### 1.3 Camadas da Aplicação

```
┌─────────────────────────────────────────────┐
│              Presentation Layer              │
│   Next.js Pages · Server Components · UI    │
├─────────────────────────────────────────────┤
│              Application Layer               │
│         Use Cases · DTOs · Result<T,E>      │
├─────────────────────────────────────────────┤
│               Domain Layer                   │
│    Entities · Value Objects · Interfaces    │
├─────────────────────────────────────────────┤
│            Infrastructure Layer              │
│   Prisma · BullMQ · Stripe · Resend · Redis │
└─────────────────────────────────────────────┘
```

---

## 2. Estrutura de Diretórios

```
src/
├── proxy.ts                      # Next.js 16: resolução de tenant por hostname (substitui middleware.ts)
├── app/                          # Next.js App Router
│   ├── (public)/                 # Rotas públicas (forms, signup)
│   │   ├── f/[formSlug]/         # Form público por tenant
│   │   └── signup/
│   ├── (dashboard)/              # Rotas autenticadas do painel
│   │   ├── dashboard/
│   │   │   ├── forms/
│   │   │   ├── submissions/
│   │   │   ├── settings/
│   │   │   └── billing/
│   │   └── onboarding/
│   └── api/                      # Route Handlers
│       ├── webhooks/stripe/
│       ├── gdpr/
│       └── health/
│
├── domain/                       # Camada de domínio (zero dependências externas)
│   ├── form/
│   │   ├── Form.entity.ts
│   │   ├── FormField.vo.ts       # Value Object
│   │   ├── FormSchema.vo.ts
│   │   └── IFormRepository.ts    # Interface
│   ├── tenant/
│   │   ├── Tenant.entity.ts
│   │   ├── TenantTheme.vo.ts
│   │   └── ITenantRepository.ts
│   ├── submission/
│   │   ├── Submission.entity.ts
│   │   └── ISubmissionRepository.ts
│   ├── billing/
│   │   ├── Plan.entity.ts
│   │   └── IBillingService.ts
│   ├── user/
│   │   ├── User.entity.ts
│   │   ├── Role.enum.ts
│   │   └── IMemberRepository.ts
│   └── shared/
│       ├── DomainError.ts
│       └── Result.ts             # Result<T, E> monad
│
├── application/                  # Use Cases (um arquivo por caso de uso)
│   ├── form/
│   │   ├── CreateFormUseCase.ts
│   │   ├── PublishFormUseCase.ts
│   │   ├── UpdateFormUseCase.ts
│   │   └── DeleteFormUseCase.ts
│   ├── tenant/
│   │   ├── ProvisionTenantUseCase.ts
│   │   └── UpdateThemeUseCase.ts
│   ├── submission/
│   │   └── SubmitFormUseCase.ts
│   ├── billing/
│   │   └── HandleStripeWebhookUseCase.ts
│   └── member/
│       ├── InviteMemberUseCase.ts
│       └── AcceptInviteUseCase.ts
│
├── infrastructure/               # Implementações concretas
│   ├── db/
│   │   ├── prisma.client.ts
│   │   ├── withTenantContext.ts  # Injeta SET app.tenant_id
│   │   ├── form.repository.ts
│   │   ├── tenant.repository.ts
│   │   └── submission.repository.ts
│   ├── queue/
│   │   ├── email.worker.ts
│   │   ├── export.worker.ts
│   │   └── webhook.worker.ts
│   ├── email/
│   │   └── resend.adapter.ts
│   ├── stripe/
│   │   └── stripe.adapter.ts
│   └── vercel/
│       └── vercel.provisioner.ts
│
├── presentation/
│   ├── components/               # Componentes UI reutilizáveis
│   ├── hooks/                    # Custom hooks
│   └── stores/                   # Zustand stores
│
└── lib/
    ├── env.ts                    # Env vars tipadas com Zod
    ├── auth.ts                   # Helpers de autenticação
    └── permissions.ts            # requirePermission()

tests/
├── unit/                         # Testes de Use Cases e Domain (sem I/O)
├── integration/                  # Testes contra DB real (TestContainers)
└── e2e/                          # Playwright: fluxos completos por tenant
```

---

## Sprint 1 — Fundação · Infra, Auth e Multi-tenant Base

> **Duração estimada:** 2 semanas  
> **Objetivo:** Estabelecer a base irremovível do produto — RLS, auth, proxy de tenant e CI/CD. Nenhuma sprint seguinte é possível sem esta.

### Requisitos Funcionais

| ID | Requisito | Tipo | Prioridade |
|----|-----------|------|-----------|
| S1-F01 | Setup do repositório com Next.js 16, TypeScript strict (TS 5.1+), Tailwind CSS v4 (`@import "tailwindcss"`, PostCSS com `@tailwindcss/postcss`), ESLint (Flat Config), Prettier e Husky (pre-commit: lint + typecheck). Sem `tailwind.config.js` — customização via `@theme` no CSS. | Setup | 🔴 Alta |
| S1-F02 | Schema Prisma com tabelas: `tenants`, `users`, `tenant_members` (roles: owner/admin/editor/viewer), `plans`, `subscriptions` | Database | 🔴 Alta |
| S1-F03 | Habilitar RLS no PostgreSQL para **todas** as tabelas. Política padrão: `tenant_id = current_setting('app.tenant_id')::uuid` | Segurança | 🔴 Alta |
| S1-F04 | Função `withTenantContext(tenantId, callback)` que executa `SET app.tenant_id` antes de qualquer query e `RESET` após | Database | 🔴 Alta |
| S1-F05 | Arquivo `proxy.ts` (Next.js 16: substitui `middleware.ts`) na raiz ou em `src/` que resolve tenant pelo hostname (subdomínio ou custom domain) e injeta `x-tenant-id` e `x-tenant-slug` nos headers. Runtime Node.js. | Proxy | 🔴 Alta |
| S1-F06 | Cache Redis para resolução de tenant (TTL: 5 min) com invalidação quando tenant atualiza domínio | Performance | 🔴 Alta |
| S1-F07 | Integração Supabase Auth: magic link + OAuth Google. JWT deve incluir `tenant_id` e `role` como custom claims | Auth | 🔴 Alta |
| S1-F08 | Seed de banco com 2 tenants de teste, 3 usuários por tenant e dados isolados para validar RLS em dev | Dev | 🔴 Alta |
| S1-F09 | Variáveis de ambiente tipadas com Zod em `src/lib/env.ts` — build falha com mensagem descritiva se env inválida | Config | 🔴 Alta |
| S1-F10 | GitHub Actions: pipeline CI com typecheck, lint (ESLint ou Biome diretamente — Next.js 16 não inclui `next lint`), unit tests e integration tests a cada PR | CI/CD | 🔴 Alta |

### Implementação de Referência

**RLS — Política base (executar após cada `CREATE TABLE`):**
```sql
-- Habilitar RLS
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Política de isolamento por tenant
CREATE POLICY tenant_isolation ON forms
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Bloquear acesso sem contexto (segurança adicional)
CREATE POLICY deny_no_context ON forms
  AS RESTRICTIVE
  USING (current_setting('app.tenant_id', true) IS NOT NULL);
```

**withTenantContext — Wrapper obrigatório:**
```typescript
// src/infrastructure/db/withTenantContext.ts
export async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL app.tenant_id = ${tenantId}`;
    return callback(tx);
  });
}
```

**Proxy de resolução de tenant (Next.js 16 — `proxy.ts` substitui `middleware.ts`):**
```typescript
// src/proxy.ts (ou na raiz do projeto)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';
  const tenant = await resolveTenant(hostname); // busca no Redis → banco

  if (!tenant) return NextResponse.rewrite(new URL('/404', request.url));

  const response = NextResponse.next();
  response.headers.set('x-tenant-id', tenant.id);
  response.headers.set('x-tenant-slug', tenant.slug);
  return response;
}
```

**Tailwind CSS v4 — Setup mínimo (Sprint 1):**
- Instalar: `tailwindcss`, `@tailwindcss/postcss`, `postcss`.
- `postcss.config.mjs`: `plugins: { '@tailwindcss/postcss': {} }`.
- No CSS global (ex.: `app/globals.css`): `@import "tailwindcss";` — sem `@tailwind base/components/utilities`.
- Customização via `@theme { ... }` no mesmo arquivo CSS (cores, fontes, breakpoints). Detecção de classes automática; não configurar `content`.

### Testes Requeridos

| ID | Teste | Tipo | Prioridade |
|----|-------|------|-----------|
| S1-T01 | `TenantResolver.resolve(hostname)` retorna `tenantId` correto para subdomínio e custom domain | Unit | 🔴 Alta |
| S1-T02 | `withTenantContext` garante que `SET app.tenant_id` é chamado antes da query e `RESET` após conclusão | Unit | 🔴 Alta |
| S1-T03 | Query em tabela com RLS sem context definido lança erro. Com context correto retorna apenas dados do tenant | Integration | 🔴 Alta |
| S1-T04 | Tenant A não pode ler dados do Tenant B mesmo com SQL direto via pg client | Integration | 🔴 Alta |
| S1-T05 | `env.ts` com Zod lança erro descritivo quando `DATABASE_URL` está ausente ou mal formada | Unit | 🟡 Média |

### Entregável
- [ ] Repositório configurado e CI verde
- [ ] Banco com RLS funcionando (validado pelo seed)
- [ ] Proxy (`proxy.ts`) resolvendo tenant por hostname
- [ ] Tailwind v4 configurado (PostCSS + `@import "tailwindcss"`)
- [ ] `SPRINT_1.md` com checklist de validação manual

---

## Sprint 2 — Onboarding de Tenant & White-label Engine

> **Duração estimada:** 2 semanas  
> **Objetivo:** Empresa cria conta, configura marca própria (cores, logo, fonte) e acessa via subdomínio com identidade visual via CSS Variables server-side, zero FOUC.

### Requisitos Funcionais

| ID | Requisito | Tipo | Prioridade |
|----|-----------|------|-----------|
| S2-F01 | Página de signup público `/signup`: nome da empresa, slug (validado: único, lowercase, sem espaço), e-mail e senha | UI/UX | 🔴 Alta |
| S2-F02 | `ProvisionTenantUseCase`: cria `tenants`, `tenant_members` (owner), `subscription` no plano trial, chama `ISubdomainProvisioner` | Use Case | 🔴 Alta |
| S2-F03 | `VercelProvisioner`: cria alias `{slug}.formflow.app` via Vercel API. Encapsulado em `ISubdomainProvisioner` para testabilidade | Infra | 🔴 Alta |
| S2-F04 | Schema `TenantTheme` VO: `primaryColor` (hex), `secondaryColor` (hex), `fontFamily` (enum: sans/serif/mono), `borderRadius` (sm/md/lg), `logoUrl`, `faviconUrl` | Domain | 🔴 Alta |
| S2-F05 | `UpdateThemeUseCase`: valida schema com Zod, persiste no banco, invalida cache Redis do tenant | Use Case | 🔴 Alta |
| S2-F06 | Server Component `ThemeProvider`: busca `TenantTheme` no servidor e injeta `<style>` com CSS variables no `<head>` — zero FOUC garantido | Frontend | 🔴 Alta |
| S2-F07 | Editor de tema em `/dashboard/settings/theme`: color picker, seletor de fonte, upload de logo com preview em tempo real | UI/UX | 🔴 Alta |
| S2-F08 | Upload de logo/favicon via Supabase Storage. Bucket privado com signed URLs. Validação: max 2MB, `image/png` ou `image/jpeg` | Storage | 🟡 Média |
| S2-F09 | Custom domain: tenant adiciona domínio próprio (ex: `forms.empresa.com`). Sistema valida CNAME e provisiona SSL via Vercel API | Domínio | 🟡 Média |
| S2-F10 | Página `/onboarding` com 3 steps: (1) Dados da empresa, (2) Configurar tema, (3) Convidar membros. Progress salvo por step no banco | UI/UX | 🔴 Alta |

### Implementação de Referência

**ThemeProvider — CSS Variables server-side (Next.js 16: APIs de request são assíncronas):**
```typescript
// src/app/layout.tsx (Server Component)
export default async function RootLayout({ children }) {
  const tenantId = (await headers()).get('x-tenant-id');
  const theme = await getTenantTheme(tenantId); // sem 'use client'

  const cssVars = `
    :root {
      --primary: ${theme.primaryColor};
      --secondary: ${theme.secondaryColor};
      --font: ${theme.fontFamily};
      --radius: ${theme.borderRadius};
    }
  `;

  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        <link rel="icon" href={theme.faviconUrl} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**ProvisionTenantUseCase — Orquestração com DIP:**
```typescript
// src/application/tenant/ProvisionTenantUseCase.ts
export class ProvisionTenantUseCase {
  constructor(
    private readonly tenantRepo: ITenantRepository,       // abstração
    private readonly memberRepo: IMemberRepository,        // abstração
    private readonly provisioner: ISubdomainProvisioner,   // abstração
    private readonly billing: IBillingService,             // abstração
  ) {}

  async execute(dto: ProvisionTenantDTO): Promise<Result<Tenant, DomainError>> {
    const slug = SlugVO.create(dto.slug); // lança SlugInvalidError se inválido
    if (slug.isFailure) return Result.fail(slug.error);

    const tenant = await this.tenantRepo.create({ ...dto, slug: slug.value });
    await this.memberRepo.addOwner(tenant.id, dto.userId);
    await this.billing.createTrial(tenant.id);
    await this.provisioner.provision(slug.value); // VercelProvisioner ou mock

    return Result.ok(tenant);
  }
}
```

### Testes Requeridos

| ID | Teste | Tipo | Prioridade |
|----|-------|------|-----------|
| S2-T01 | `ProvisionTenantUseCase` com `ISubdomainProvisioner` mockado — verifica sequência correta: tenant → member → subscription → subdomain | Unit | 🔴 Alta |
| S2-T02 | `UpdateThemeUseCase` rejeita hex inválido e `fontFamily` fora do enum — via Zod schema | Unit | 🔴 Alta |
| S2-T03 | `ThemeProvider` server component retorna CSS variables corretas para Tenant A e Tenant B em requests separados | Integration | 🔴 Alta |
| S2-T04 | E2E: signup → configurar tema → acessar subdomínio → verificar que `--primary-color` bate com a configurada | E2E | 🔴 Alta |
| S2-T05 | Slug validation rejeita: espaços, maiúsculas, caracteres especiais, e slugs já existentes no banco | Unit | 🔴 Alta |

### Entregável
- [ ] Signup criando tenant isolado no banco
- [ ] Subdomínio provisionado automaticamente
- [ ] Editor de tema funcional com preview
- [ ] CSS Variables aplicadas server-side sem FOUC
- [ ] `SPRINT_2.md` com checklist de validação manual

---

## Sprint 3 — Form Builder · CRUD, Schema e Publicação

> **Duração estimada:** 3 semanas  
> **Objetivo:** Core do produto — criar, editar e publicar formulários com schema dinâmico versionado. Schema é imutável após publicação (cria nova versão).

### Requisitos Funcionais

| ID | Requisito | Tipo | Prioridade |
|----|-----------|------|-----------|
| S3-F01 | Tabela `forms`: `id`, `tenant_id`, `title`, `description`, `schema (jsonb)`, `status (draft/published/archived)`, `created_at`, `published_at`. RLS ativo. | Database | 🔴 Alta |
| S3-F02 | Tabela `form_versions`: versão imutável do schema. Ao publicar, cria `form_version`. Submissions referenciam `form_version_id`. | Database | 🔴 Alta |
| S3-F03 | `FormField` VO: `type` (text/email/tel/number/select/radio/checkbox/textarea/date/file), `label`, `placeholder`, `required`, `validationRules`, `order` | Domain | 🔴 Alta |
| S3-F04 | `CreateFormUseCase`: cria form em `draft` com schema vazio. `PublishFormUseCase`: valida schema (min 1 campo), cria `form_version`, muda status. | Use Case | 🔴 Alta |
| S3-F05 | Form Builder UI: drag-and-drop de campos via `@dnd-kit`, painel de propriedades do campo selecionado, preview em tempo real side-by-side | UI/UX | 🔴 Alta |
| S3-F06 | Cada tipo de campo tem seu próprio componente de edição de propriedades. **SRP**: um componente por tipo de campo. | Frontend | 🔴 Alta |
| S3-F07 | Preview do form renderiza em iframe isolado com o tema do tenant aplicado — idêntico ao que o usuário final verá | UI/UX | 🔴 Alta |
| S3-F08 | Autosave a cada 3s de inatividade via debounce. Indicador visual de status: `salvando...` / `salvo ✓` / `erro ao salvar` | UX | 🔴 Alta |
| S3-F09 | Listagem de forms com filtro por status, busca por título, ordenação por data. Paginação server-side cursor-based. | UI/UX | 🔴 Alta |
| S3-F10 | Endpoint público `GET /f/[formSlug]`: serve o form publicado para o tenant do subdomínio. 404 se draft ou não pertence ao tenant. | API | 🔴 Alta |
| S3-F11 | Limite de forms por plano: Starter=3, Growth=20, Business=ilimitado. Verificado no `CreateFormUseCase` antes de criar. | Business Rule | 🔴 Alta |

### Implementação de Referência

**FormField Value Object:**
```typescript
// src/domain/form/FormField.vo.ts
export type FieldType =
  | 'text' | 'email' | 'tel' | 'number'
  | 'select' | 'radio' | 'checkbox'
  | 'textarea' | 'date' | 'file';

export interface FormFieldProps {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];         // para select, radio, checkbox
  validationRules?: ValidationRule[];
  order: number;
}

export class FormField {
  private constructor(private readonly props: FormFieldProps) {}

  static create(props: FormFieldProps): Result<FormField, DomainError> {
    if (!props.label.trim()) return Result.fail(new FieldLabelRequiredError());
    if (['select', 'radio'].includes(props.type) && (props.options?.length ?? 0) < 2) {
      return Result.fail(new FieldOptionsRequiredError(props.type));
    }
    return Result.ok(new FormField(props));
  }
}
```

**PublishFormUseCase:**
```typescript
// src/application/form/PublishFormUseCase.ts
export class PublishFormUseCase {
  constructor(
    private readonly formRepo: IFormRepository,
    private readonly versionRepo: IFormVersionRepository,
  ) {}

  async execute(dto: { formId: string; tenantId: string }): Promise<Result<FormVersion, DomainError>> {
    const form = await this.formRepo.findById(dto.formId, dto.tenantId);
    if (!form) return Result.fail(new FormNotFoundError(dto.formId));
    if (form.fields.length === 0) return Result.fail(new FormEmptyError());

    const version = await this.versionRepo.create({
      formId: form.id,
      schema: form.schema,        // snapshot imutável
      publishedAt: new Date(),
    });

    await this.formRepo.updateStatus(form.id, 'published', dto.tenantId);
    return Result.ok(version);
  }
}
```

### Testes Requeridos

| ID | Teste | Tipo | Prioridade |
|----|-------|------|-----------|
| S3-T01 | `PublishFormUseCase` lança `FormValidationError` quando schema tem 0 campos ou campo sem label | Unit | 🔴 Alta |
| S3-T02 | `CreateFormUseCase` lança `PlanLimitError` quando tenant atingiu limite do plano — mockando `IFormRepository.countByTenant()` | Unit | 🔴 Alta |
| S3-T03 | `FormField` VO rejeita campo do tipo `select` sem ao menos 2 opções definidas | Unit | 🔴 Alta |
| S3-T04 | `GET /f/[slug]` retorna 404 para form de outro tenant mesmo que o slug exista no banco | Integration | 🔴 Alta |
| S3-T05 | `PublishFormUseCase` cria `form_version` e **não** muta o schema original do form draft | Integration | 🔴 Alta |
| S3-T06 | E2E: criar form com 3 campos → publicar → acessar via URL pública → verificar que campos são renderizados | E2E | 🔴 Alta |

### Entregável
- [ ] Form Builder funcional com drag-and-drop
- [ ] Publicação com versionamento imutável
- [ ] Form público acessível por subdomínio
- [ ] Autosave funcionando
- [ ] `SPRINT_3.md` com checklist de validação manual

---

## Sprint 4 — Submissions, Notificações e Dashboard

> **Duração estimada:** 2 semanas  
> **Objetivo:** Coletar respostas de forma segura, validar server-side, notificar via email e exibir analytics no painel do tenant.

### Requisitos Funcionais

| ID | Requisito | Tipo | Prioridade |
|----|-----------|------|-----------|
| S4-F01 | Tabela `submissions`: `id`, `tenant_id`, `form_id`, `form_version_id`, `data (jsonb)`, `ip_hash` (não PII), `user_agent`, `created_at`. RLS ativo. | Database | 🔴 Alta |
| S4-F02 | `POST /f/[formSlug]/submit`: valida payload contra JSON schema da `form_version`, persiste, dispara job. Rate limit: 10 req/min por IP por form. | API | 🔴 Alta |
| S4-F03 | `SubmitFormUseCase`: orquestra `SubmissionValidator`, `ISubmissionRepository` e `INotificationQueue`. **SRP estrito** — cada dependência tem responsabilidade única. | Use Case | 🔴 Alta |
| S4-F04 | `EmailNotificationWorker` (BullMQ): envia email para owner e admins do tenant via Resend. Template React com logo e cores do tenant. | Jobs | 🔴 Alta |
| S4-F05 | Página `/dashboard/forms/[id]/submissions`: tabela com campos, filtro por date range, busca full-text (PostgreSQL GIN index em `data jsonb`). | UI/UX | 🔴 Alta |
| S4-F06 | Export de submissions: CSV e JSON. Gerado assincronamente via `ExportWorker`, link de download enviado por email após conclusão. | Feature | 🟡 Média |
| S4-F07 | Dashboard home: cards com submissions hoje/semana/mês, forms mais ativos, gráfico de linha por dia (últimos 30 dias). | UI/UX | 🔴 Alta |
| S4-F08 | Webhook por form: tenant configura URL, sistema envia POST com payload. Retry automático: backoff exponencial, 3 tentativas. | Feature | 🟡 Média |
| S4-F09 | Resposta de sucesso customizável: redirect URL ou mensagem personalizada com variáveis (`{nome}`, `{email}`). | Feature | 🟡 Média |
| S4-F10 | **Honeypot anti-spam**: campo oculto no form. Se preenchido, retorna `200` mas NÃO persiste — silently drop. Nunca revelar ao submitter. | Segurança | 🔴 Alta |
| S4-F11 | Limite de submissions/mês por plano: Starter=1k, Growth=10k, Business=ilimitado. Form exibe mensagem customizável quando limite atingido. | Business Rule | 🔴 Alta |

### Implementação de Referência

**SubmitFormUseCase — SRP com injeção de dependências:**
```typescript
// src/application/submission/SubmitFormUseCase.ts
export class SubmitFormUseCase {
  constructor(
    private readonly formRepo: IFormRepository,
    private readonly submissionRepo: ISubmissionRepository,
    private readonly validator: ISubmissionValidator,
    private readonly notificationQueue: INotificationQueue,
    private readonly planChecker: IPlanLimitChecker,
  ) {}

  async execute(dto: SubmitFormDTO): Promise<Result<Submission, DomainError>> {
    // Honeypot check — silently drop
    if (dto.honeypot) return Result.ok(null as unknown as Submission);

    // Verificar limite do plano
    const limitOk = await this.planChecker.checkSubmissions(dto.tenantId);
    if (!limitOk) return Result.fail(new PlanLimitError('submissions'));

    // Validar contra o schema da versão publicada
    const validationResult = await this.validator.validate(dto.formVersionId, dto.data);
    if (validationResult.isFailure) return Result.fail(validationResult.error);

    // Persistir
    const submission = await this.submissionRepo.create({
      tenantId: dto.tenantId,
      formId: dto.formId,
      formVersionId: dto.formVersionId,
      data: dto.data,
      ipHash: hashIp(dto.ip),
    });

    // Notificar de forma assíncrona (não bloqueia response)
    await this.notificationQueue.enqueue('email-notification', {
      tenantId: dto.tenantId,
      submissionId: submission.id,
    });

    return Result.ok(submission);
  }
}
```

### Testes Requeridos

| ID | Teste | Tipo | Prioridade |
|----|-------|------|-----------|
| S4-T01 | `SubmitFormUseCase` com todos deps mockados — verifica que `INotificationQueue.enqueue()` é chamado após persistência bem-sucedida | Unit | 🔴 Alta |
| S4-T02 | `SubmitFormUseCase` NÃO persiste nem notifica quando honeypot está preenchido | Unit | 🔴 Alta |
| S4-T03 | `SubmitFormUseCase` lança `PlanLimitError` quando limite mensal de submissions foi atingido | Unit | 🔴 Alta |
| S4-T04 | `POST /submit` com campo required ausente retorna `422` com array de erros por campo no formato `{field, message}` | Integration | 🔴 Alta |
| S4-T05 | Submission criada tem `tenant_id` correto e NÃO pode ser lida via query sem contexto RLS | Integration | 🔴 Alta |
| S4-T06 | E2E: preencher form publicado → submeter → verificar que aparece na listagem do dashboard | E2E | 🔴 Alta |

### Entregável
- [ ] Submissões funcionando com validação server-side
- [ ] Honeypot anti-spam ativo
- [ ] Notificação por email via BullMQ + Resend
- [ ] Dashboard com analytics básico
- [ ] `SPRINT_4.md` com checklist de validação manual

---

## Sprint 5 — Billing, Planos e Gestão de Membros

> **Duração estimada:** 2 semanas  
> **Objetivo:** Monetização completa via Stripe, gestão de assinaturas, upgrade/downgrade e controle granular de permissões por role.

### Requisitos Funcionais

| ID | Requisito | Tipo | Prioridade |
|----|-----------|------|-----------|
| S5-F01 | Integração Stripe: criar Customer e Subscription no signup. Planos: Starter (R$97), Growth (R$297), Business (R$697). IDs dos planos em env vars. | Billing | 🔴 Alta |
| S5-F02 | Página `/dashboard/billing`: plano atual, data de renovação, botão upgrade/downgrade, histórico de faturas via Stripe API, link para Customer Portal. | UI/UX | 🔴 Alta |
| S5-F03 | Webhook Stripe (`POST /api/webhooks/stripe`): processar `customer.subscription.updated`, `invoice.paid`, `invoice.payment_failed`. Idempotente via `stripe-signature`. | Billing | 🔴 Alta |
| S5-F04 | Falha no pagamento: email de alerta, `tenant.status = 'payment_overdue'`. Após 7 dias, suspender submissões (forms ficam visíveis, não aceitam respostas). | Business Rule | 🔴 Alta |
| S5-F05 | Convite de membros: owner/admin envia invite por email. Link com JWT (exp: 48h). Ao aceitar, cria `tenant_member` com role escolhida. | Feature | 🔴 Alta |
| S5-F06 | **Matriz de permissões por role:** Owner (tudo), Admin (tudo exceto cancelar plano/deletar tenant), Editor (CRUD forms + ver submissions), Viewer (somente leitura). | Auth | 🔴 Alta |
| S5-F07 | `requirePermission(action, resource)` — guard reutilizável em todos os route handlers e use cases. Lança `ForbiddenError` tipado. | Auth | 🔴 Alta |
| S5-F08 | Página `/dashboard/settings/members`: listar membros com role e status, editar role, revogar acesso, reenviar convite expirado. | UI/UX | 🔴 Alta |
| S5-F09 | Trial de 14 dias: novo tenant começa no plano Business trial. Após expirar, downgrade automático para Starter **sem perda de dados**. | Business Rule | 🔴 Alta |
| S5-F10 | API Key por tenant para integração headless: gerar, revogar, listar. Chave **hasheada** no banco (bcrypt). Header: `Authorization: Bearer {key}`. | API | 🟡 Média |

### Matriz de Permissões Completa

| Ação | Owner | Admin | Editor | Viewer |
|------|-------|-------|--------|--------|
| Criar/editar form | ✅ | ✅ | ✅ | ❌ |
| Publicar/arquivar form | ✅ | ✅ | ✅ | ❌ |
| Ver submissions | ✅ | ✅ | ✅ | ✅ |
| Exportar submissions | ✅ | ✅ | ✅ | ❌ |
| Configurar tema | ✅ | ✅ | ❌ | ❌ |
| Convidar membros | ✅ | ✅ | ❌ | ❌ |
| Editar roles de membros | ✅ | ✅ | ❌ | ❌ |
| Gerenciar billing | ✅ | ❌ | ❌ | ❌ |
| Deletar tenant | ✅ | ❌ | ❌ | ❌ |
| Gerenciar API Keys | ✅ | ✅ | ❌ | ❌ |

### Implementação de Referência

**requirePermission — Guard tipado:**
```typescript
// src/lib/permissions.ts
type Action = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'export';
type Resource = 'form' | 'submission' | 'member' | 'billing' | 'theme' | 'apikey';

const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
  owner:  { form: ['create','read','update','delete','publish'], billing: ['read','update','delete'], /* ... */ },
  admin:  { form: ['create','read','update','delete','publish'], billing: [], /* ... */ },
  editor: { form: ['create','read','update','publish'], billing: [], /* ... */ },
  viewer: { form: ['read'], billing: [], /* ... */ },
};

export function requirePermission(role: Role, action: Action, resource: Resource): void {
  const allowed = PERMISSIONS[role][resource]?.includes(action) ?? false;
  if (!allowed) throw new ForbiddenError(`Role '${role}' cannot '${action}' on '${resource}'`);
}
```

### Testes Requeridos

| ID | Teste | Tipo | Prioridade |
|----|-------|------|-----------|
| S5-T01 | `requirePermission('viewer', 'delete', 'form')` lança `ForbiddenError`. `requirePermission('editor', 'publish', 'form')` permite. | Unit | 🔴 Alta |
| S5-T02 | Webhook handler de `invoice.payment_failed` é idempotente — processar o mesmo evento 2x não altera estado na 2ª vez | Unit | 🔴 Alta |
| S5-T03 | Convidar membro → aceitar via token → verificar `tenant_member` criado com role correta no banco | Integration | 🔴 Alta |
| S5-T04 | Tenant com `payment_overdue` + 7 dias recebe `402` ao tentar submeter form | Integration | 🔴 Alta |
| S5-T05 | E2E: fluxo de upgrade — acessar billing → Stripe Checkout (modo test) → verificar plano atualizado no dashboard | E2E | 🟡 Média |

### Entregável
- [ ] Billing Stripe funcionando com webhooks
- [ ] Suspensão automática por inadimplência
- [ ] Convites e gestão de membros
- [ ] `requirePermission` em todos os endpoints
- [ ] `SPRINT_5.md` com checklist de validação manual

---

## Sprint 6 — Observabilidade, Segurança e Hardening

> **Duração estimada:** 1 semana  
> **Objetivo:** Produto pronto para produção — logging estruturado, monitoring, rate limiting robusto, auditoria, LGPD compliance e performance otimizada.

### Requisitos Funcionais

| ID | Requisito | Tipo | Prioridade |
|----|-----------|------|-----------|
| S6-F01 | Logging estruturado com **Pino**: cada request loga `tenant_id`, `user_id`, `route`, `duration_ms`, `status_code`. **Nunca logar dados de submission (PII).** | Observabilidade | 🔴 Alta |
| S6-F02 | **Sentry**: captura de erros em server e client com `tenant_id` como contexto. Ignorar erros de validação esperados (4xx). | Monitoring | 🔴 Alta |
| S6-F03 | Rate limiting via **Upstash Redis**: 100 req/min por IP em rotas de API. 10 submissions/min por IP por form. | Segurança | 🔴 Alta |
| S6-F04 | Tabela `audit_logs`: todas as ações de mutação (criar/editar form, alterar tema, convidar membro) com `actor_id`, `tenant_id`, `action`, `diff (jsonb)`, `created_at`. | Auditoria | 🔴 Alta |
| S6-F05 | **LGPD**: `POST /api/gdpr/export` — exporta todos os dados do usuário. `DELETE /api/gdpr/delete` — anonimiza dados em 30 dias (job assíncrono). | Compliance | 🔴 Alta |
| S6-F06 | Content Security Policy (CSP) headers no `next.config`. Sem `unsafe-inline`. Nonces para scripts inline necessários. | Segurança | 🔴 Alta |
| S6-F07 | Health check `GET /api/health`: verifica conexão com DB, Redis. Retorna `{status, services: {db: {ok, latency_ms}, redis: {ok, latency_ms}}}`. | Infra | 🔴 Alta |
| S6-F08 | Caching de forms públicos no edge (CDN Vercel) por 60s. Invalidado via `revalidateTag(tag, 'max')` (Next.js 16: segundo argumento obrigatório — perfil `cacheLife`) ou `updateTag(tag)` em Server Actions ao publicar nova versão. | Performance | 🔴 Alta |
| S6-F09 | Documentação de API pública: OpenAPI 3.0 spec gerada automaticamente. Disponível em `/api/docs` com Swagger UI. | Docs | 🟡 Média |
| S6-F10 | Runbook de operação: procedimentos para rollback de migration, restaurar tenant deletado, debug de RLS e escalar Redis. | Docs | 🟡 Média |

### Testes Requeridos

| ID | Teste | Tipo | Prioridade |
|----|-------|------|-----------|
| S6-T01 | Teste de carga (k6): 100 usuários simultâneos × 60s. p95 < 500ms, zero 5xx, zero vazamento entre tenants. | Performance | 🔴 Alta |
| S6-T02 | Teste de segurança: SQL injection em campos de submission não afeta o banco. Testar via sqlmap em staging. | Segurança | 🔴 Alta |
| S6-T03 | `audit_log` criado com `diff` correto ao editar título de form — verificar `old_value` e `new_value` | Integration | 🔴 Alta |
| S6-T04 | E2E: fluxo LGPD export → solicitar → receber email → baixar zip → verificar que contém apenas dados do usuário solicitante | E2E | 🔴 Alta |
| S6-T05 | Rate limiter bloqueia 11ª submission do mesmo IP no mesmo minuto com `429`. 1ª requisição após 1 min passa normalmente. | Integration | 🔴 Alta |

### Entregável
- [ ] Logging e Sentry configurados
- [ ] Rate limiting ativo em todos endpoints
- [ ] Audit logs gravando diffs
- [ ] LGPD export/delete funcionando
- [ ] Teste de carga aprovado
- [ ] `SPRINT_6.md` com checklist de validação manual

---

## 9. Instruções para o Cursor AI

### 9.1 Regras Invioláveis de Implementação

| ID | Regra | Prioridade |
|----|-------|-----------|
| R-01 | Route handlers **nunca** contêm lógica de negócio. Só chamam Use Case e retornam HTTP response. | 🔴 Alta |
| R-02 | Use Cases recebem DTOs tipados e retornam `Result<T, E>` — nunca lançam exceções para o HTTP layer. | 🔴 Alta |
| R-03 | Todo acesso ao banco passa por `withTenantContext()`. Query Prisma sem contexto RLS = bug crítico. | 🔴 Alta |
| R-04 | Componentes React são Server Components por padrão. `'use client'` só com comentário explicativo. | 🔴 Alta |
| R-04b | Next.js 16: `params`, `searchParams`, `headers()`, `cookies()`, `draftMode()` são assíncronos — usar sempre `await`. | 🔴 Alta |
| R-05 | Cada novo Use Case deve ter ao menos 3 testes unitários. Coverage mínimo: 80% em `domain/` e `application/`. | 🔴 Alta |
| R-05b | `revalidateTag(tag)` exige segundo argumento em Next.js 16: perfil `cacheLife` (ex.: `revalidateTag(tag, 'max')`) ou `updateTag(tag)` em Server Actions para read-your-writes. | 🔴 Alta |
| R-06 | Zero `any` implícito. Usar `unknown` + type narrowing. `@ts-ignore` proibido — usar `@ts-expect-error` com comentário. | 🔴 Alta |
| R-07 | Migrations Prisma: nunca usar `ALTER TABLE` sem nova migration versionada. Migrations devem ter down script documentado. | 🔴 Alta |
| R-08 | Erros de domínio são classes tipadas: `class FormNotFoundError extends DomainError`. Sem `throw new Error('string')` no domain. | 🔴 Alta |
| R-09 | Todo endpoint de API pública tem schema Zod para input. Erro de validação retorna `422` com `{field, message}[]`. | 🔴 Alta |
| R-10 | Nenhum segredo sem prefixo `NEXT_PUBLIC_` pode vazar ao client. Auditar com `next/bundle-analyzer` antes de cada deploy. | 🔴 Alta |

---

### 9.2 Ordem de Criação de Arquivos por Sprint

Execute **nesta ordem** para garantir que dependências existam antes de serem usadas:

```
1. Migrations Prisma
   └── schema.prisma → prisma migrate dev --name sprint_N

2. Domain Layer
   ├── Entidades (*.entity.ts)
   ├── Value Objects (*.vo.ts)
   └── Interfaces de repositório (I*.ts)

3. Infrastructure Layer
   ├── Implementações de repositório
   └── Adapters externos (Stripe, Resend, Vercel)

4. Application Layer
   ├── Use Cases (*.usecase.ts)
   └── Testes unitários (*.usecase.spec.ts) — simultâneos

5. Presentation Layer
   ├── Route Handlers (app/api/)
   ├── Server Components de página
   └── Client Components interativos

6. Testes
   ├── Testes de integração
   └── Testes E2E com Playwright
```

---

### 9.3 Padrão de Erro de Domínio

```typescript
// src/domain/shared/DomainError.ts
export abstract class DomainError extends Error {
  abstract readonly code: string;
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Exemplos de uso
export class FormNotFoundError extends DomainError {
  readonly code = 'FORM_NOT_FOUND';
  constructor(formId: string) {
    super(`Form '${formId}' not found or does not belong to this tenant`);
  }
}

export class PlanLimitError extends DomainError {
  readonly code = 'PLAN_LIMIT_EXCEEDED';
  constructor(resource: string) {
    super(`Plan limit exceeded for resource: ${resource}`);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
}
```

---

### 9.4 Padrão Result<T, E>

```typescript
// src/domain/shared/Result.ts
export class Result<T, E extends DomainError = DomainError> {
  private constructor(
    private readonly _value: T | null,
    private readonly _error: E | null,
  ) {}

  static ok<T>(value: T): Result<T, never> {
    return new Result(value, null) as Result<T, never>;
  }

  static fail<E extends DomainError>(error: E): Result<never, E> {
    return new Result(null, error) as Result<never, E>;
  }

  get isSuccess(): boolean { return this._error === null; }
  get isFailure(): boolean { return this._error !== null; }
  get value(): T { if (this._error) throw this._error; return this._value!; }
  get error(): E { return this._error!; }
}
```

---

### 9.5 Checklist de PR — Usar em Todo Merge

```markdown
## PR Checklist

### Código
- [ ] TypeScript strict sem erros (`tsc --noEmit`) (TS 5.1+)
- [ ] ESLint (ou Biome) sem warnings — rodar diretamente; Next.js 16 não inclui `next lint`
- [ ] Sem `any` implícito, sem `@ts-ignore`
- [ ] Nenhum segredo hardcoded

### Arquitetura
- [ ] Route handlers não contêm lógica de negócio
- [ ] Use Cases usam `Result<T, E>` — sem `throw` para HTTP layer
- [ ] Todo acesso ao banco usa `withTenantContext()`
- [ ] Novos componentes são Server Components por padrão

### Testes
- [ ] Ao menos 3 testes unitários por novo Use Case
- [ ] Teste de integração para novos endpoints
- [ ] Coverage >= 80% em `domain/` e `application/`
- [ ] CI verde

### Banco de Dados
- [ ] Nova migration criada para mudanças de schema
- [ ] RLS habilitado em novas tabelas com política de tenant
- [ ] Migration tem down script documentado
```

---

> **Fonte da Verdade:** Este documento governa todas as decisões de implementação.  
> Qualquer conflito deve ser resolvido aqui antes de codificar.  
> Versionar este arquivo junto com o código em `docs/requirements.md`.
