/**
 * Webhook Worker — dispara POST para webhook configurado pelo tenant.
 * Retry automático: backoff exponencial, 3 tentativas (configurado no producer).
 */
import { Worker } from 'bullmq';
import type { WebhookJobPayload } from '@/domain/submission/INotificationQueue';

const connection = {
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
};

export function startWebhookWorker(): Worker {
  return new Worker(
    'webhooks',
    async (job) => {
      const payload = job.data as WebhookJobPayload;
      const { webhookUrl, submissionId, formId, tenantId, data } = payload;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FormFlow-Event': 'submission.created',
          'X-FormFlow-Tenant': tenantId,
          'X-FormFlow-Form': formId,
        },
        body: JSON.stringify({
          event: 'submission.created',
          submissionId,
          formId,
          tenantId,
          data,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`Webhook retornou ${response.status}: ${await response.text()}`);
      }

      console.log(`[WebhookWorker] Webhook entregue: submissionId=${submissionId}`);
    },
    { connection, concurrency: 10 }
  );
}

if (require.main === module) {
  const worker = startWebhookWorker();
  console.log('[WebhookWorker] Worker iniciado...');

  worker.on('failed', (job, err) => {
    console.error(`[WebhookWorker] Job ${job?.id} falhou:`, err.message);
  });

  process.on('SIGTERM', async () => {
    await worker.close();
    process.exit(0);
  });
}
