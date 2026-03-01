import type { PrismaClient } from '@prisma/client';
import { prisma } from './prisma.client';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Executa callback dentro de um contexto RLS do tenant.
 * Define SET LOCAL app.tenant_id antes das queries e garante isolamento por tenant.
 * Nota: SET LOCAL no PostgreSQL não aceita parâmetros ($1); o valor é interpolado de forma segura (apenas UUID).
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  if (!UUID_REGEX.test(tenantId)) {
    throw new Error('withTenantContext: tenantId deve ser um UUID válido');
  }
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
    return callback(tx as TransactionClient);
  });
}
