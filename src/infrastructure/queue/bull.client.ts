import { Queue } from 'bullmq';

const connection = {
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
};

const globalForQueues = globalThis as unknown as {
  emailQueue?: Queue;
  exportQueue?: Queue;
  webhookQueue?: Queue;
};

export const emailQueue: Queue =
  globalForQueues.emailQueue ?? new Queue('email-notifications', { connection });

export const exportQueue: Queue =
  globalForQueues.exportQueue ?? new Queue('exports', { connection });

export const webhookQueue: Queue =
  globalForQueues.webhookQueue ?? new Queue('webhooks', { connection });

if (process.env.NODE_ENV !== 'production') {
  globalForQueues.emailQueue = emailQueue;
  globalForQueues.exportQueue = exportQueue;
  globalForQueues.webhookQueue = webhookQueue;
}
