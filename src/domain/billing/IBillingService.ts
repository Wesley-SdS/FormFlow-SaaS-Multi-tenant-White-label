/**
 * Abstração do serviço de billing — criação de trial no signup.
 * Implementação em infrastructure (Stripe/subs no banco).
 */

export interface IBillingService {
  createTrial(tenantId: string): Promise<void>;
}
