/**
 * Email Notification Worker — processa jobs da fila 'email-notifications'.
 * Executar em processo separado: pnpm worker:email
 *
 * Busca: owners e admins do tenant para notificar.
 * Envia email via Resend com template React (logo + cores do tenant).
 */
import { Worker } from 'bullmq';
import { prisma } from '../db/prisma.client';
import { sendSubmissionNotification } from '../email/resend.adapter';
import type { EmailNotificationPayload } from '@/domain/submission/INotificationQueue';

const connection = {
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
};

export function startEmailWorker(): Worker {
  return new Worker(
    'email-notifications',
    async (job) => {
      const payload = job.data as EmailNotificationPayload;
      const { tenantId, submissionId, formId } = payload;

      const [tenant, submission, form] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantId } }),
        prisma.submission.findUnique({ where: { id: submissionId } }),
        prisma.form.findUnique({ where: { id: formId } }),
      ]);

      if (!tenant || !submission || !form) {
        console.warn('[EmailWorker] Dados não encontrados para job:', payload);
        return;
      }

      const members = await prisma.tenantMember.findMany({
        where: {
          tenantId,
          role: { in: ['owner', 'admin'] },
        },
        include: { user: true },
      });

      const emails = members.map((m) => m.user.email).filter(Boolean);
      if (emails.length === 0) {
        console.warn('[EmailWorker] Nenhum destinatário para tenant:', tenantId);
        return;
      }

      await sendSubmissionNotification({
        to: emails,
        tenantName: tenant.name,
        formTitle: form.title,
        formId,
        submissionData: submission.data as Record<string, unknown>,
        primaryColor: tenant.primaryColor,
        submissionId,
      });

      console.log(`[EmailWorker] Notificação enviada: submissionId=${submissionId}`);
    },
    { connection, concurrency: 5 }
  );
}

// Entry point quando executado diretamente
if (require.main === module) {
  const worker = startEmailWorker();
  console.log('[EmailWorker] Worker iniciado, aguardando jobs...');

  worker.on('completed', (job) => {
    console.log(`[EmailWorker] Job ${job.id} concluído`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} falhou:`, err.message);
  });

  process.on('SIGTERM', async () => {
    await worker.close();
    process.exit(0);
  });
}
