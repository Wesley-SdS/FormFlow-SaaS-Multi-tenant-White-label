/**
 * Limites por plano — fonte da verdade para verificações de quota.
 * null = ilimitado.
 */
export const PLAN_FORM_LIMITS: Record<string, number | null> = {
  starter: 3,
  growth: 20,
  business: null,
};

export const PLAN_SUBMISSION_LIMITS: Record<string, number | null> = {
  starter: 1000,
  growth: 10000,
  business: null,
};

/**
 * Retorna o plano atual do tenant consultando o banco.
 * Fallback para 'starter' se não houver assinatura.
 */
export async function getTenantPlanSlug(tenantId: string): Promise<string> {
  try {
    const { prisma } = await import('@/infrastructure/db/prisma.client');
    const sub = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });
    return sub?.plan?.slug ?? 'starter';
  } catch {
    return 'starter';
  }
}
