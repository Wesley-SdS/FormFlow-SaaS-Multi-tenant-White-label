import { PrismaClient, TenantMemberRole, PlanSlug } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const planStarter = await prisma.plan.upsert({
    where: { slug: PlanSlug.starter },
    create: { slug: PlanSlug.starter, name: 'Starter' },
    update: {},
  });
  const planGrowth = await prisma.plan.upsert({
    where: { slug: PlanSlug.growth },
    create: { slug: PlanSlug.growth, name: 'Growth' },
    update: {},
  });
  const planBusiness = await prisma.plan.upsert({
    where: { slug: PlanSlug.business },
    create: { slug: PlanSlug.business, name: 'Business' },
    update: {},
  });

  /** UUID fixo para dev: use no .env como DEV_TENANT_ID (localhost) */
  const DEV_TENANT_A_ID = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee';
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'tenant-a' },
    create: { id: DEV_TENANT_A_ID, name: 'Tenant A', slug: 'tenant-a' },
    update: {},
  });
  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'tenant-b' },
    create: { name: 'Tenant B', slug: 'tenant-b' },
    update: {},
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'owner-a@formflow.dev' },
    create: { email: 'owner-a@formflow.dev' },
    update: {},
  });
  const user2 = await prisma.user.upsert({
    where: { email: 'admin-a@formflow.dev' },
    create: { email: 'admin-a@formflow.dev' },
    update: {},
  });
  const user3 = await prisma.user.upsert({
    where: { email: 'editor-a@formflow.dev' },
    create: { email: 'editor-a@formflow.dev' },
    update: {},
  });
  const user4 = await prisma.user.upsert({
    where: { email: 'owner-b@formflow.dev' },
    create: { email: 'owner-b@formflow.dev' },
    update: {},
  });
  const user5 = await prisma.user.upsert({
    where: { email: 'admin-b@formflow.dev' },
    create: { email: 'admin-b@formflow.dev' },
    update: {},
  });
  const user6 = await prisma.user.upsert({
    where: { email: 'viewer-b@formflow.dev' },
    create: { email: 'viewer-b@formflow.dev' },
    update: {},
  });

  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant1.id, userId: user1.id } },
    create: { tenantId: tenant1.id, userId: user1.id, role: TenantMemberRole.owner },
    update: {},
  });
  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant1.id, userId: user2.id } },
    create: { tenantId: tenant1.id, userId: user2.id, role: TenantMemberRole.admin },
    update: {},
  });
  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant1.id, userId: user3.id } },
    create: { tenantId: tenant1.id, userId: user3.id, role: TenantMemberRole.editor },
    update: {},
  });
  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant2.id, userId: user4.id } },
    create: { tenantId: tenant2.id, userId: user4.id, role: TenantMemberRole.owner },
    update: {},
  });
  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant2.id, userId: user5.id } },
    create: { tenantId: tenant2.id, userId: user5.id, role: TenantMemberRole.admin },
    update: {},
  });
  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant2.id, userId: user6.id } },
    create: { tenantId: tenant2.id, userId: user6.id, role: TenantMemberRole.viewer },
    update: {},
  });

  await prisma.subscription.upsert({
    where: { tenantId: tenant1.id },
    create: { tenantId: tenant1.id, planId: planBusiness.id, status: 'trial' },
    update: {},
  });
  await prisma.subscription.upsert({
    where: { tenantId: tenant2.id },
    create: { tenantId: tenant2.id, planId: planStarter.id, status: 'active' },
    update: {},
  });

  console.log('Seed concluído: 2 tenants, 6 usuários, 6 tenant_members, 2 subscriptions');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
