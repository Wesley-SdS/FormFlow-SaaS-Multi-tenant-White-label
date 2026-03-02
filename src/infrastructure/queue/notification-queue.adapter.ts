import { emailQueue, exportQueue, webhookQueue } from './bull.client';
import type {
  INotificationQueue,
  EmailNotificationPayload,
  ExportJobPayload,
  WebhookJobPayload,
} from '@/domain/submission/INotificationQueue';

export class NotificationQueueAdapter implements INotificationQueue {
  async enqueueEmailNotification(payload: EmailNotificationPayload): Promise<void> {
    await emailQueue.add('notify', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async enqueueExport(payload: ExportJobPayload): Promise<void> {
    await exportQueue.add('export', payload, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 10000 },
      removeOnComplete: 10,
    });
  }

  async enqueueWebhook(payload: WebhookJobPayload): Promise<void> {
    await webhookQueue.add('webhook', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 50,
      removeOnFail: 50,
    });
  }
}
