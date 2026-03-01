import { Result } from '@/domain/shared/Result';
import { SlugInvalidError } from '@/domain/shared/DomainError';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
const MIN_LENGTH = 2;
const MAX_LENGTH = 63;

/**
 * Value Object: slug do tenant.
 * Regras: único, lowercase, sem espaços, apenas [a-z0-9-], 2–63 caracteres.
 */
export class SlugVO {
  private constructor(private readonly _value: string) {}

  static create(candidate: string): Result<SlugVO, SlugInvalidError> {
    const trimmed = candidate.trim();
    if (trimmed.length < MIN_LENGTH) {
      return Result.fail(new SlugInvalidError(candidate, `mínimo ${MIN_LENGTH} caracteres`));
    }
    if (trimmed.length > MAX_LENGTH) {
      return Result.fail(new SlugInvalidError(candidate, `máximo ${MAX_LENGTH} caracteres`));
    }
    const lower = trimmed.toLowerCase();
    if (lower !== trimmed && lower !== candidate) {
      return Result.fail(new SlugInvalidError(candidate, 'deve ser lowercase'));
    }
    if (/\s/.test(trimmed)) {
      return Result.fail(new SlugInvalidError(candidate, 'não pode conter espaços'));
    }
    if (!SLUG_REGEX.test(lower)) {
      return Result.fail(
        new SlugInvalidError(
          candidate,
          'apenas letras minúsculas, números e hífens (não pode começar/terminar com hífen)'
        )
      );
    }
    return Result.ok(new SlugVO(lower));
  }

  get value(): string {
    return this._value;
  }
}
