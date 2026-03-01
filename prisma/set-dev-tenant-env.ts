/**
 * Obtém o ID do tenant com slug "tenant-a" e grava em .tenant-id para uso no setup.
 * Uso: npx tsx prisma/set-dev-tenant-env.ts
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'tenant-a' },
    select: { id: true },
  });

  if (!tenant) {
    console.error('Tenant com slug "tenant-a" não encontrado. Rode: pnpm db:seed');
    process.exit(1);
  }

  const root = process.cwd();
  writeFileSync(join(root, '.tenant-id'), tenant.id, 'utf-8');

  const envPath = join(root, '.env');
  let content = readFileSync(envPath, 'utf-8');
  content = content.replace(/DEV_TENANT_ID="[^"]*"/, `DEV_TENANT_ID="${tenant.id}"`);
  writeFileSync(envPath, content, 'utf-8');

  console.log('DEV_TENANT_ID atualizado no .env:', tenant.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
