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
