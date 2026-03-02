# Sprint 4 — Submissions, Notificações e Dashboard

> **Status:** ✅ Implementado  
> **Duração estimada:** 2 semanas  
> **Objetivo:** Coletar respostas de forma segura, validar server-side, notificar via email e exibir analytics no painel.

---

## Checklist de Requisitos

### Database
- [x] **S4-F01** — Tabela `submissions`: `id`, `tenant_id`, `form_id`, `form_version_id`, `data (jsonb)`, `ip_hash`, `user_agent`, `created_at`. RLS ativo.
- [x] Índice GIN em `data jsonb` para busca full-text: `CREATE INDEX submissions_data_gin ON submissions USING gin(data)`
- [x] Colunas no Form: `webhook_url`, `success_message`, `redirect_url`

### API & Rate Limiting
- [x] **S4-F02** — `POST /f/[formSlug]/submit`: valida payload, aplica honeypot, persiste, dispara jobs. Rate limit: 10 req/min por IP por form via Redis.
- [x] `GET /api/forms/[id]/submissions` — Listagem com paginação cursor-based e filtro por date range
- [x] `POST /api/forms/[id]/submissions/export` — Gera CSV ou JSON diretamente (download imediato)

### Use Case
- [x] **S4-F03** — `SubmitFormUseCase`: orquestra `IFormRepository`, `IFormVersionRepository`, `ISubmissionRepository`, `INotificationQueue`, `IPlanLimitChecker`. SRP estrito.
- [x] **S4-F10** — Honeypot anti-spam: campo `_hp` oculto. Se preenchido, retorna `200` mas NÃO persiste — silently drop.
- [x] **S4-F11** — Limite de submissions/mês: Starter=1k, Growth=10k, Business=ilimitado. `PlanLimitChecker` verifica antes de persistir.

### Notificações (BullMQ)
- [x] **S4-F04** — `EmailNotificationWorker`: envia para owners e admins via Resend. Template React com logo e cores do tenant. Script: `pnpm worker:email`
- [x] `ExportWorker`: gera CSV/JSON e envia por email. Script: `pnpm worker:export`
- [x] **S4-F08** — `WebhookWorker`: dispara POST para URL configurada. Retry: backoff exponencial, 3 tentativas. Script: `pnpm worker:webhook`
- [x] `pnpm worker:all` para subir todos os workers simultaneamente

### Dashboard Analytics
- [x] **S4-F07** — Cards reais: Respostas hoje / esta semana / este mês / total
- [x] Gráfico de barras: respostas dos últimos 30 dias (query SQL GROUP BY DATE)
- [x] Top 5 formulários mais ativos com barras de progresso proporcional
- [x] Acesso rápido: Criar formulário / Meus formulários / Personalizar tema

### UI — Submissions
- [x] **S4-F05** — `/dashboard/forms/[id]/submissions`: tabela com filtro por date range, paginação cursor-based ("Carregar mais"), botões exportar CSV/JSON
- [x] Linhas expansíveis para formulários com mais de 4 campos
- [x] Botão "Respostas" na listagem de forms (para publicados)
- [x] Link "Respostas" no editor de formulários publicados

### Resposta Customizável
- [x] **S4-F09** — `successMessage` por form. Se `redirectUrl` configurado, redireciona após submissão.

---

## Arquitetura de Arquivos

```
src/
├── domain/submission/
│   ├── Submission.entity.ts
│   ├── ISubmissionRepository.ts    (+ SubmissionStats, DailyCount)
│   ├── INotificationQueue.ts       (Email, Export, Webhook payloads)
│   └── IPlanLimitChecker.ts
├── infrastructure/
│   ├── db/submission.repository.ts  (RLS + raw SQL para analytics)
│   ├── queue/
│   │   ├── bull.client.ts           (3 filas: email, export, webhook)
│   │   ├── notification-queue.adapter.ts
│   │   ├── email.worker.ts
│   │   ├── export.worker.ts
│   │   └── webhook.worker.ts
│   ├── email/
│   │   ├── resend.adapter.ts
│   │   └── submission-notification.template.tsx
│   ├── rate-limiter.ts              (Redis sliding window + hashIp)
│   └── billing/plan-limit-checker.ts
├── application/submission/
│   └── SubmitFormUseCase.ts
├── app/
│   ├── f/[formSlug]/submit/route.ts  (POST com rate limit + honeypot)
│   ├── api/forms/[id]/submissions/
│   │   ├── route.ts                  (GET)
│   │   └── export/route.ts           (POST → CSV/JSON download)
│   └── dashboard/
│       ├── page.tsx                  (analytics reais do banco)
│       └── forms/[id]/submissions/
│           ├── page.tsx
│           └── SubmissionsClient.tsx
```

---

## Configuração para Email (Resend)

```bash
# .env
RESEND_API_KEY="re_..."            # https://resend.com → API Keys
RESEND_FROM_EMAIL="noreply@seudominio.com"
```

> Sem `RESEND_API_KEY`: as notificações são **simuladas no console** (fail-safe para desenvolvimento).

## Subindo Workers em Desenvolvimento

```bash
# Terminal separado do dev server:
pnpm worker:all

# Ou individualmente:
pnpm worker:email
pnpm worker:export
pnpm worker:webhook
```

---

## Checklist de Validação Manual

### Fluxo 1: Submeter formulário público
1. Publique um formulário com campos obrigatórios
2. Acesse `/f/[slug]`
3. Preencha os campos e envie
4. **Esperado:** mensagem de sucesso ou redirect

### Fluxo 2: Honeypot
1. Faça POST em `/f/[slug]/submit` com `_hp: "bot"` no body
2. **Esperado:** retorna 200 sem persistir no banco

### Fluxo 3: Rate limiting
1. Faça 11 POSTs em menos de 1 minuto
2. **Esperado:** 11ª requisição retorna 429 com `Retry-After`

### Fluxo 4: Visualizar respostas
1. Acesse `/dashboard/forms/[id]/submissions`
2. Teste filtro por data
3. Clique em "CSV" ou "JSON" para exportar

### Fluxo 5: Dashboard com analytics
1. Acesse `/dashboard`
2. **Esperado:** cards com contagens reais, gráfico de 30 dias, top 5 formulários

---

## Migrações

```
prisma/migrations/20260301234801_sprint4_submissions/migration.sql
```

**Down script:**
```sql
ALTER TABLE forms DROP COLUMN IF EXISTS webhook_url;
ALTER TABLE forms DROP COLUMN IF EXISTS success_message;
ALTER TABLE forms DROP COLUMN IF EXISTS redirect_url;
DROP TABLE IF EXISTS submissions;
```
