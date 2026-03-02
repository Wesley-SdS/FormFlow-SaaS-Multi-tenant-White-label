import type { IPlanLimitChecker } from '@/domain/submission/IPlanLimitChecker';
import {
  PLAN_FORM_LIMITS,
  PLAN_SUBMISSION_LIMITS,
  getTenantPlanSlug,
} from '@/domain/billing/plan-limits';

export class PlanLimitChecker implements IPlanLimitChecker {
  async checkSubmissions(tenantId: string): Promise<boolean> {
    const planSlug = await getTenantPlanSlug(tenantId);
    const limit = PLAN_SUBMISSION_LIMITS[planSlug];
    if (limit === null) return true;

    const { prisma } = await import('@/infrastructure/db/prisma.client');
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const count = await prisma.submission.count({
      where: { tenantId, createdAt: { gte: monthStart } },
    });

    return count < limit;
  }

  async checkForms(tenantId: string): Promise<boolean> {
    const planSlug = await getTenantPlanSlug(tenantId);
    const limit = PLAN_FORM_LIMITS[planSlug];
    if (limit === null) return true;

    const { prisma } = await import('@/infrastructure/db/prisma.client');
    const count = await prisma.form.count({ where: { tenantId } });
    return count < limit;
  }
}
