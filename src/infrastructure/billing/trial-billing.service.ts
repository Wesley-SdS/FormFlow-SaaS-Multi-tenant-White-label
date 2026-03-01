import type { IBillingService } from '@/domain/billing/IBillingService';
import { prisma } from '@/infrastructure/db/prisma.client';
import { withTenantContext } from '@/infrastructure/db/withTenantContext';
import { PlanSlug } from '@prisma/client';

const PLAN_NAMES: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  business: 'Business',
};

/**
 * Cria assinatura trial para novo tenant (plano Business trial).
 * Garante que o plano existe via upsert (não depende do seed estar rodado).
 */
export class TrialBillingService implements IBillingService {
  async createTrial(tenantId: string): Promise<void> {
    const plan = await prisma.plan.upsert({
      where: { slug: PlanSlug.business },
      create: { slug: PlanSlug.business, name: PLAN_NAMES.business },
      update: {},
    });

    await withTenantContext(tenantId, async (tx) => {
      await tx.subscription.upsert({
        where: { tenantId },
        create: {
          tenantId,
          planId: plan.id,
          status: 'trial',
        },
        update: {},
      });
    });
  }
}
