/**
 * Abstração do repositório de membros do tenant — DIP.
 * Responsável por criar tenant_members (owner no signup).
 */

export interface IMemberRepository {
  addOwner(tenantId: string, userId: string): Promise<void>;
}
