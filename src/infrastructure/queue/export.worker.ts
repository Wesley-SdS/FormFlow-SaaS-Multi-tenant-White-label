/**
 * Export Worker — gera CSV ou JSON de submissões e envia por email.
 * Executar em processo separado: pnpm worker:export
 */
import { Worker } from 'bullmq';
import { prisma } from '../db/prisma.client';
import { sendExportReadyEmail } from '../email/resend.adapter';
import type { ExportJobPayload } from '@/domain/submission/INotificationQueue';

const connection = {
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
};

function generateCsv(submissions: { data: unknown; createdAt: Date }[]): string {
  if (submissions.length === 0) return 'Nenhuma submissão encontrada\n';

  const allKeys = new Set<string>();
  submissions.forEach((s) => {
    Object.keys(s.data as object).forEach((k) => allKeys.add(k));
  });

  const keys = ['_created_at', ...Array.from(allKeys)];
  const escapeCsv = (v: unknown): string => {
    const str = v == null ? '' : String(v);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const header = keys.map(escapeCsv).join(',');
  const rows = submissions.map((s) => {
    const data = s.data as Record<string, unknown>;
    return keys
      .map((k) => (k === '_created_at' ? escapeCsv(s.createdAt.toISOString()) : escapeCsv(data[k])))
      .join(',');
  });

  return [header, ...rows].join('\n');
}

export function startExportWorker(): Worker {
  return new Worker(
    'exports',
    async (job) => {
      const payload = job.data as ExportJobPayload;
      const { tenantId, formId, format, requestedByEmail } = payload;

      const form = await prisma.form.findUnique({ where: { id: formId } });
      if (!form) return;

      const submissions = await prisma.submission.findMany({
        where: { tenantId, formId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, data: true, createdAt: true },
      });

      let content: string;
      let mimeType: string;
      let filename: string;

      if (format === 'csv') {
        content = generateCsv(submissions);
        mimeType = 'text/csv';
        filename = `${form.slug}-submissions.csv`;
      } else {
        content = JSON.stringify(
          submissions.map((s) => ({ id: s.id, data: s.data, createdAt: s.createdAt })),
          null,
          2
        );
        mimeType = 'application/json';
        filename = `${form.slug}-submissions.json`;
      }

      // Em produção: faria upload para Supabase Storage e geraria signed URL
      // Para desenvolvimento: simulamos com data URL
      const dataUrl = `data:${mimeType};base64,${Buffer.from(content).toString('base64')}`;

      await sendExportReadyEmail({
        to: requestedByEmail,
        downloadUrl: dataUrl,
        formTitle: form.title,
      });

      console.log(
        `[ExportWorker] Exportação concluída: formId=${formId}, format=${format}, rows=${submissions.length}`
      );
    },
    { connection, concurrency: 2 }
  );
}

if (require.main === module) {
  const worker = startExportWorker();
  console.log('[ExportWorker] Worker iniciado...');

  worker.on('failed', (job, err) => {
    console.error(`[ExportWorker] Job ${job?.id} falhou:`, err.message);
  });

  process.on('SIGTERM', async () => {
    await worker.close();
    process.exit(0);
  });
}
