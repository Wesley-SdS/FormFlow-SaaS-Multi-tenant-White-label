/**
 * Erro de domínio — todas as falhas de regra de negócio são tipadas.
 * Nunca usar throw new Error('string') no domain/application.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, this.constructor.prototype);
  }
}

export class SlugInvalidError extends DomainError {
  readonly code = 'SLUG_INVALID';

  constructor(slug: string, reason: string) {
    super(`Slug inválido '${slug}': ${reason}`);
  }
}

export class SlugAlreadyExistsError extends DomainError {
  readonly code = 'SLUG_ALREADY_EXISTS';

  constructor(slug: string) {
    super(`Slug '${slug}' já está em uso`);
  }
}

export class TenantNotFoundError extends DomainError {
  readonly code = 'TENANT_NOT_FOUND';

  constructor(tenantId: string) {
    super(`Tenant '${tenantId}' não encontrado`);
  }
}

export class ThemeValidationError extends DomainError {
  readonly code = 'THEME_VALIDATION';

  constructor(message: string) {
    super(message);
  }
}

export class FormNotFoundError extends DomainError {
  readonly code = 'FORM_NOT_FOUND';

  constructor(formId: string) {
    super(`Formulário '${formId}' não encontrado ou não pertence a este tenant`);
  }
}

export class FormEmptyError extends DomainError {
  readonly code = 'FORM_EMPTY';

  constructor() {
    super('O formulário deve ter ao menos 1 campo antes de ser publicado');
  }
}

export class FormAlreadyPublishedError extends DomainError {
  readonly code = 'FORM_ALREADY_PUBLISHED';

  constructor(formId: string) {
    super(`Formulário '${formId}' já está publicado`);
  }
}

export class FieldLabelRequiredError extends DomainError {
  readonly code = 'FIELD_LABEL_REQUIRED';

  constructor() {
    super('O campo deve ter um label');
  }
}

export class FieldOptionsRequiredError extends DomainError {
  readonly code = 'FIELD_OPTIONS_REQUIRED';

  constructor(type: string) {
    super(`Campo do tipo '${type}' deve ter ao menos 2 opções`);
  }
}

export class PlanLimitError extends DomainError {
  readonly code = 'PLAN_LIMIT_EXCEEDED';

  constructor(resource: string) {
    super(`Limite do plano atingido para: ${resource}`);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';

  constructor(message = 'Acesso negado') {
    super(message);
  }
}

export class FormNotPublishedError extends DomainError {
  readonly code = 'FORM_NOT_PUBLISHED';

  constructor(slug: string) {
    super(`Formulário '${slug}' não está disponível para submissão`);
  }
}

export class SubmissionValidationError extends DomainError {
  readonly code = 'SUBMISSION_VALIDATION';

  constructor(
    message: string,
    public readonly fieldErrors: { field: string; message: string }[] = []
  ) {
    super(message);
  }
}

export class RateLimitError extends DomainError {
  readonly code = 'RATE_LIMIT_EXCEEDED';

  constructor() {
    super('Muitas tentativas. Aguarde 1 minuto antes de tentar novamente.');
  }
}

export class SubmissionLimitError extends DomainError {
  readonly code = 'SUBMISSION_LIMIT_EXCEEDED';

  constructor() {
    super('O limite mensal de submissões deste plano foi atingido.');
  }
}
