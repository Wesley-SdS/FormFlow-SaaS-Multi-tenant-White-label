export interface EmailNotificationPayload {
  tenantId: string;
  submissionId: string;
  formId: string;
}

export interface ExportJobPayload {
  tenantId: string;
  formId: string;
  format: 'csv' | 'json';
  requestedByEmail: string;
}

export interface WebhookJobPayload {
  tenantId: string;
  submissionId: string;
  formId: string;
  webhookUrl: string;
  data: Record<string, unknown>;
}

export interface INotificationQueue {
  enqueueEmailNotification(payload: EmailNotificationPayload): Promise<void>;
  enqueueExport(payload: ExportJobPayload): Promise<void>;
  enqueueWebhook(payload: WebhookJobPayload): Promise<void>;
}
