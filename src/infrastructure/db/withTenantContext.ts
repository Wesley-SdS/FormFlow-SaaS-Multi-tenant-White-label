import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { prisma } from './prisma.client';

/**
 * Executa callback dentro de um contexto RLS do tenant.
 * Define SET LOCAL app.tenant_id antes das queries e garante isolamento por tenant.
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`SET LOCAL app.tenant_id = ${tenantId}`);
    return callback(tx);
  });
}
