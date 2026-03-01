import type { IMemberRepository } from '@/domain/user/IMemberRepository';
import { prisma } from './prisma.client';
import { withTenantContext } from './withTenantContext';
import { TenantMemberRole } from '@prisma/client';

/**
 * Repositório de membros do tenant. addOwner executa dentro de withTenantContext
 * para satisfazer RLS na tabela tenant_members.
 */
export class MemberRepository implements IMemberRepository {
  async addOwner(tenantId: string, userId: string): Promise<void> {
    await withTenantContext(tenantId, async (tx) => {
      await tx.tenantMember.upsert({
        where: {
          tenantId_userId: { tenantId, userId },
        },
        create: {
          tenantId,
          userId,
          role: TenantMemberRole.owner,
        },
        update: {},
      });
    });
  }
}
