# Sprint 2 — Onboarding de Tenant & White-label Engine

## Checklist de validação manual

- [ ] **Signup**  
  Acessar `/signup`, preencher nome da empresa, slug (ex.: `minha-empresa`), e-mail e senha.  
  Submeter e verificar que a conta é criada e a mensagem de sucesso exibe o link do subdomínio.

- [ ] **Slug**  
  Tentar slug com espaços, maiúsculas ou caracteres especiais e verificar mensagem de erro.  
  Tentar slug já existente e verificar erro 409.

- [ ] **Subdomínio**  
  Com `VERCEL_TOKEN` e `VERCEL_PROJECT_ID` configurados (opcional em dev), criar conta e verificar que o alias é provisionado.  
  Em dev sem token, o signup não deve falhar.

- [ ] **Onboarding**  
  Acessar `https://{slug}.{dominio}/onboarding`.  
  Concluir os 3 passos (dados da empresa, configurar tema, convidar membros).  
  Verificar que o progresso é salvo (avançar e recarregar a página).

- [ ] **Tema**  
  Em `/dashboard/settings/theme`, alterar cor primária, secundária, fonte e bordas.  
  Salvar e recarregar a página: as variáveis CSS (`--ff-primary`, `--ff-font-family`, etc.) devem refletir o tema.

- [ ] **Zero FOUC**  
  Abrir o subdomínio do tenant em aba anônima: a cor primária e a fonte devem aparecer desde o primeiro paint, sem “piscar” o tema padrão.

- [ ] **Cache Redis**  
  Após alterar o tema, acessar o subdomínio: a nova cor deve aparecer.  
  (Se Redis estiver ativo, a invalidação deve ter removido o cache do tenant.)

## Requisitos implementados

| ID    | Requisito | Status |
|-------|-----------|--------|
| S2-F01 | Página `/signup`: nome, slug, e-mail, senha | ✅ |
| S2-F02 | ProvisionTenantUseCase: tenant, member owner, subscription trial, provisioner | ✅ |
| S2-F03 | VercelProvisioner em ISubdomainProvisioner | ✅ |
| S2-F04 | Schema TenantTheme (VO + Prisma) | ✅ |
| S2-F05 | UpdateThemeUseCase + Zod + invalidação Redis | ✅ |
| S2-F06 | CSS variables no `<head>` (layout) — zero FOUC | ✅ |
| S2-F07 | Editor de tema em `/dashboard/settings/theme` | ✅ |
| S2-F08 | Upload logo/favicon (Supabase Storage) | ⏳ Requer bucket e env; ver nota abaixo |
| S2-F09 | Custom domain (CNAME, Vercel SSL) | ⏳ Planejado para iteração futura |
| S2-F10 | Página `/onboarding` com 3 steps e progresso no banco | ✅ |

## Upload de logo/favicon (S2-F08)

Para ativar o upload:

1. Criar bucket no Supabase Storage (privado).
2. Configurar variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Implementar `POST /api/tenant/theme/upload` que valida tipo (`image/png`, `image/jpeg`) e tamanho (máx. 2MB), faz upload e retorna signed URL para persistir em `logoUrl`/`faviconUrl`.

## Testes

- **Unitários:** `SlugVO`, `ProvisionTenantUseCase`, `UpdateThemeUseCase` (mock de repositórios e provisioner).
- **Integração:** Theme no layout (variáveis por tenant) e APIs de tema/onboarding (com tenant nos headers).
- **E2E:** Signup → configurar tema → acessar subdomínio e conferir `--ff-primary` (recomendado com Playwright).

Executar: `pnpm test` ou `npm run test:run`.
