# Sprint 3 — Form Builder: CRUD, Schema e Publicação

> **Status:** ✅ Implementado  
> **Duração estimada:** 3 semanas  
> **Objetivo:** Core do produto — criar, editar e publicar formulários com schema dinâmico versionado.

---

## Checklist de Requisitos

### Database
- [x] **S3-F01** — Tabela `forms`: `id`, `tenant_id`, `slug`, `title`, `description`, `schema (jsonb)`, `status (draft/published/archived)`, `created_at`, `updated_at`, `published_at`. RLS ativo com política de tenant.
- [x] **S3-F02** — Tabela `form_versions`: versão imutável do schema. Ao publicar, cria `form_version` com snapshot do schema. `versionNumber` auto-incrementado.

### Domain
- [x] **S3-F03** — `FormField` VO: tipos `text/email/tel/number/select/radio/checkbox/textarea/date/file`, `label`, `placeholder`, `required`, `options`, `validationRules`, `order`. Validação com `Result<T,E>`.
- [x] Domain errors adicionados: `FormNotFoundError`, `FormEmptyError`, `FormAlreadyPublishedError`, `FieldLabelRequiredError`, `FieldOptionsRequiredError`, `PlanLimitError`, `ForbiddenError`

### Use Cases
- [x] **S3-F04** — `CreateFormUseCase`: cria form em `draft` com schema vazio. Verifica limite do plano antes de criar.
- [x] **S3-F04** — `PublishFormUseCase`: valida min 1 campo, cria `form_version` imutável, muda status para `published`.
- [x] `UpdateFormUseCase`: atualiza título, descrição e schema de form em draft.
- [x] `DeleteFormUseCase`: remove form verificando ownership pelo tenant.

### Business Rules
- [x] **S3-F11** — Limite de forms por plano: `starter=3`, `growth=20`, `business=ilimitado`. Verificado em `CreateFormUseCase`.

### API Routes
- [x] `POST /api/forms` — Cria formulário (verifica limite do plano)
- [x] `GET /api/forms` — Lista formulários com filtro, busca e paginação cursor-based
- [x] `GET /api/forms/[id]` — Busca formulário por ID
- [x] `PATCH /api/forms/[id]` — Atualiza formulário (autosave)
- [x] `DELETE /api/forms/[id]` — Remove formulário
- [x] `POST /api/forms/[id]/publish` — Publica formulário criando version
- [x] **S3-F10** — `GET /f/[formSlug]` — Serve form publicado para o tenant. Retorna 404 se draft ou não pertence ao tenant.

### UI — Dashboard
- [x] **S3-F09** — Listagem de forms com filtro por status, busca por título, cards com ações (editar, publicar, ver público, deletar).
- [x] Página de criação `/dashboard/forms/new` — form de título e descrição.
- [x] **S3-F05** — Form Builder com drag-and-drop (@dnd-kit), painel de tipos de campo (esquerdo), canvas (centro), painel de propriedades (direito).
- [x] **S3-F06** — Cada tipo de campo tem componente de edição específico (SRP): `TextFieldEditor`, `TextareaFieldEditor`, `OptionsFieldEditor`, `FieldEditorFactory`.
- [x] **S3-F07** — Preview do formulário em modal com renderização idêntica ao usuário final.
- [x] **S3-F08** — Autosave a cada 3s de inatividade via debounce. Indicador visual: `salvando...` / `salvo ✓` / `erro ao salvar`.

### UI — Pública
- [x] Página pública `/f/[formSlug]` com todos os tipos de campo renderizados.
- [x] Estado de sucesso após submissão.

---

## Arquitetura de Arquivos Criados

```
src/
├── domain/form/
│   ├── Form.entity.ts          # Entidade Form com status
│   ├── FormField.vo.ts         # Value Object com validação
│   ├── FormVersion.entity.ts   # Entidade imutável de versão
│   ├── IFormRepository.ts      # Interface + DTOs
│   └── IFormVersionRepository.ts
├── domain/billing/
│   └── plan-limits.ts          # Limites por plano (Starter/Growth/Business)
├── infrastructure/db/
│   ├── form.repository.ts      # Implementação com withTenantContext + RLS
│   └── form-version.repository.ts
├── application/form/
│   ├── CreateFormUseCase.ts    # Verifica limite do plano
│   ├── PublishFormUseCase.ts   # Cria FormVersion imutável
│   ├── UpdateFormUseCase.ts    # Atualização parcial (autosave)
│   └── DeleteFormUseCase.ts
├── app/api/forms/
│   ├── route.ts                # POST /api/forms, GET /api/forms
│   └── [id]/
│       ├── route.ts            # GET/PATCH/DELETE /api/forms/[id]
│       └── publish/route.ts    # POST /api/forms/[id]/publish
├── app/f/[formSlug]/
│   ├── page.tsx                # Server Component: valida form + tenant
│   └── PublicFormRenderer.tsx  # Client Component: renderiza campos
└── app/dashboard/forms/
    ├── page.tsx                # Server Component: lista initial forms
    ├── FormsClient.tsx         # Client Component: filtros + CRUD
    ├── new/page.tsx            # Criação de formulário
    └── [id]/
        ├── page.tsx            # Server Component: carrega form
        ├── FormBuilder.tsx     # Form Builder principal com DnD
        ├── SortableFieldItem.tsx  # Item arrastrável (DnD)
        ├── FormPreview.tsx     # Preview modal
        └── field-editors/
            ├── FieldEditorFactory.tsx   # Factory por tipo
            ├── TextFieldEditor.tsx
            ├── TextareaFieldEditor.tsx
            └── OptionsFieldEditor.tsx  # select/radio/checkbox
```

---

## Checklist de Validação Manual

### Fluxo 1: Criar formulário
1. Acesse `/dashboard/forms`
2. Clique em "Novo formulário"
3. Preencha título e clique em "Criar e abrir editor →"
4. **Esperado:** redirecionado para `/dashboard/forms/[id]` com o editor aberto

### Fluxo 2: Construir formulário com drag-and-drop
1. No editor, clique nos tipos de campo no painel esquerdo para adicioná-los
2. Clique num campo para ver suas propriedades no painel direito
3. Edite o label e propriedades
4. Arraste campos para reordenar
5. **Esperado:** indicador "Salvo ✓" aparece após 3s

### Fluxo 3: Preview
1. Clique em "Preview" na barra superior
2. **Esperado:** modal abre mostrando o formulário como o usuário final veria

### Fluxo 4: Publicar formulário
1. Com ao menos 1 campo adicionado, clique em "Publicar"
2. **Esperado:** redirecionado para `/dashboard/forms` com status "Publicado"

### Fluxo 5: Acessar form público
1. Na listagem, clique em "Ver público" no form publicado
2. **Esperado:** formulário exibido em `/f/[slug]` com o tema do tenant

### Fluxo 6: Limite do plano Starter
1. Com plano Starter (padrão trial), tente criar mais de 3 formulários
2. **Esperado:** erro 403 "Limite do plano atingido"

---

## Migrações

```
prisma/migrations/20260301222421_sprint3_form_builder/migration.sql
```

**Down script (reverter):**
```sql
DROP TABLE IF EXISTS form_versions;
DROP TABLE IF EXISTS forms;
DROP TYPE IF EXISTS "FormStatus";
```

---

## Pendências para Sprints Futuras

- **Sprint 4:** Submissões via `POST /f/[formSlug]/submit` com validação server-side
- **Sprint 4:** Listagem de submissões por form no dashboard
- **Sprint 4:** Honeypot anti-spam
- **Sprint 5:** `requirePermission` para proteger endpoints por role
