-- FormFlow Sprint 1 — Políticas RLS (executar APÓS a primeira migração Prisma)
-- Run: psql $DATABASE_URL -f prisma/rls.policies.sql

-- Tenant
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Tenant"
  USING (id = (current_setting('app.tenant_id', true)::uuid));

CREATE POLICY deny_no_context ON "Tenant"
  AS RESTRICTIVE
  USING (current_setting('app.tenant_id', true) IS NOT NULL AND current_setting('app.tenant_id', true) != '');

-- tenant_members
ALTER TABLE "tenant_members" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "tenant_members"
  USING (tenant_id = (current_setting('app.tenant_id', true)::uuid));

CREATE POLICY deny_no_context ON "tenant_members"
  AS RESTRICTIVE
  USING (current_setting('app.tenant_id', true) IS NOT NULL AND current_setting('app.tenant_id', true) != '');

-- subscriptions
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "subscriptions"
  USING (tenant_id = (current_setting('app.tenant_id', true)::uuid));

CREATE POLICY deny_no_context ON "subscriptions"
  AS RESTRICTIVE
  USING (current_setting('app.tenant_id', true) IS NOT NULL AND current_setting('app.tenant_id', true) != '');

-- User (sem tenant_id; controle por aplicação)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_select ON "User" FOR SELECT USING (true);
CREATE POLICY allow_update ON "User" FOR UPDATE USING (true);

-- plans (tabela global)
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_select_plans ON "plans" FOR SELECT USING (true);
