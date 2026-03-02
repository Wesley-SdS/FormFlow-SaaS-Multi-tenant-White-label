import { randomUUID } from 'crypto';
import { Result } from '@/domain/shared/Result';
import {
  FormNotFoundError,
  FormNotPublishedError,
  SubmissionValidationError,
  SubmissionLimitError,
} from '@/domain/shared/DomainError';
import type { DomainError } from '@/domain/shared/DomainError';
import type { Submission } from '@/domain/submission/Submission.entity';
import type { ISubmissionRepository } from '@/domain/submission/ISubmissionRepository';
import type { INotificationQueue } from '@/domain/submission/INotificationQueue';
import type { IPlanLimitChecker } from '@/domain/submission/IPlanLimitChecker';
import type { IFormRepository } from '@/domain/form/IFormRepository';
import type { IFormVersionRepository } from '@/domain/form/IFormVersionRepository';
import type { FormFieldProps } from '@/domain/form/FormField.vo';

export interface SubmitFormDTO {
  tenantId: string;
  formId: string;
  formVersionId: string;
  data: Record<string, unknown>;
  honeypot?: string;
  ipHash?: string;
  userAgent?: string;
  webhookUrl?: string;
}

type SubmitResult = { submission: Submission; successMessage: string; redirectUrl?: string };

export class SubmitFormUseCase {
  constructor(
    private readonly formRepo: IFormRepository,
    private readonly versionRepo: IFormVersionRepository,
    private readonly submissionRepo: ISubmissionRepository,
    private readonly notificationQueue: INotificationQueue,
    private readonly planChecker: IPlanLimitChecker
  ) {}

  async execute(dto: SubmitFormDTO): Promise<Result<SubmitResult, DomainError>> {
    // S4-F10: Honeypot anti-spam — silently drop sem revelar ao submitter
    if (dto.honeypot) {
      const fakeSub = {
        submission: {} as Submission,
        successMessage: 'Obrigado! Sua resposta foi enviada.',
      };
      return Result.ok(fakeSub);
    }

    // S4-F11: Verificar limite de submissões do plano
    const limitOk = await this.planChecker.checkSubmissions(dto.tenantId);
    if (!limitOk) {
      return Result.fail(new SubmissionLimitError());
    }

    // Buscar form e version
    const form = await this.formRepo.findById(dto.formId, dto.tenantId);
    if (!form) return Result.fail(new FormNotFoundError(dto.formId));
    if (!form.isPublished()) return Result.fail(new FormNotPublishedError(form.slug));

    const version = await this.versionRepo.findLatestByFormId(dto.formId, dto.tenantId);
    if (!version) return Result.fail(new FormNotFoundError(dto.formId));

    // Validar campos obrigatórios contra o schema da form_version
    const validationErrors = this.validateData(version.schema, dto.data);
    if (validationErrors.length > 0) {
      return Result.fail(
        new SubmissionValidationError('Campos obrigatórios não preenchidos', validationErrors)
      );
    }

    // Persistir submissão
    const submission = await this.submissionRepo.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      formId: dto.formId,
      formVersionId: version.id,
      data: dto.data,
      ipHash: dto.ipHash,
      userAgent: dto.userAgent,
    });

    // S4-F04: Enfileirar notificação por email (assíncrono — não bloqueia response)
    this.notificationQueue
      .enqueueEmailNotification({
        tenantId: dto.tenantId,
        submissionId: submission.id,
        formId: dto.formId,
      })
      .catch((err) => console.error('[SubmitForm] Falha ao enfileirar email:', err));

    // S4-F08: Enfileirar webhook se configurado
    if (dto.webhookUrl) {
      this.notificationQueue
        .enqueueWebhook({
          tenantId: dto.tenantId,
          submissionId: submission.id,
          formId: dto.formId,
          webhookUrl: dto.webhookUrl,
          data: dto.data,
        })
        .catch((err) => console.error('[SubmitForm] Falha ao enfileirar webhook:', err));
    }

    return Result.ok({
      submission,
      successMessage: 'Obrigado! Sua resposta foi enviada.',
    });
  }

  /**
   * Valida campos required do schema da form_version contra os dados submetidos.
   */
  private validateData(
    schema: FormFieldProps[],
    data: Record<string, unknown>
  ): { field: string; message: string }[] {
    const errors: { field: string; message: string }[] = [];

    for (const field of schema) {
      if (!field.required) continue;

      const value = data[field.id];
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        errors.push({ field: field.id, message: `${field.label} é obrigatório` });
      }
    }

    return errors;
  }
}
