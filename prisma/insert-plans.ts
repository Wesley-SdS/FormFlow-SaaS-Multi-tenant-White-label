import { PrismaClient, PlanSlug } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

async function run() {
  const results: string[] = [];
  for (const slug of [PlanSlug.starter, PlanSlug.growth, PlanSlug.business]) {
    const plan = await prisma.plan.upsert({
      where: { slug },
      create: { slug, name: slug.charAt(0).toUpperCase() + slug.slice(1) },
      update: {},
    });
    results.push(`${plan.slug}: ${plan.id}`);
  }
  const existing = await prisma.plan.findMany({ select: { slug: true, name: true } });
  const out = [...results, 'PLANS IN DB:', ...existing.map((p) => `  ${p.slug} - ${p.name}`)].join('\n');
  writeFileSync('insert-plans-result.txt', out, 'utf-8');
  console.log(out);
}

run()
  .catch((e) => {
    writeFileSync('insert-plans-result.txt', String(e), 'utf-8');
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
