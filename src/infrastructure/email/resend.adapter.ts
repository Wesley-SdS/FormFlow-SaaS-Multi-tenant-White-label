import { Resend } from 'resend';
import { render } from '@react-email/render';
import { SubmissionNotificationEmail } from './submission-notification.template';

const resend = new Resend(process.env.RESEND_API_KEY ?? '');
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@formflow.app';

export interface SendSubmissionNotificationParams {
  to: string[];
  tenantName: string;
  formTitle: string;
  formId: string;
  submissionData: Record<string, unknown>;
  primaryColor: string;
  submissionId: string;
}

export async function sendSubmissionNotification(
  params: SendSubmissionNotificationParams
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY não configurada — notificação simulada:', {
      to: params.to,
      subject: `Nova resposta: ${params.formTitle}`,
      submissionId: params.submissionId,
    });
    return;
  }

  const html = await render(
    SubmissionNotificationEmail({
      tenantName: params.tenantName,
      formTitle: params.formTitle,
      submissionData: params.submissionData,
      primaryColor: params.primaryColor,
      submissionId: params.submissionId,
      appUrl,
      formId: params.formId,
    })
  );

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Nova resposta: ${params.formTitle}`,
    html,
  });
}

export async function sendExportReadyEmail(params: {
  to: string;
  downloadUrl: string;
  formTitle: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Export ready simulado:', params);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [params.to],
    subject: `Exportação pronta: ${params.formTitle}`,
    html: `
      <p>Sua exportação está pronta.</p>
      <p><a href="${params.downloadUrl}">Baixar arquivo</a></p>
      <p>O link expira em 24 horas.</p>
    `,
  });
}
