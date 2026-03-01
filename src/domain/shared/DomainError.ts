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
