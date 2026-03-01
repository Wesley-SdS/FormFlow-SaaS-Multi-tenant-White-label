import type { DomainError } from './DomainError';

/**
 * Result monad: sucesso T ou falha E (DomainError).
 * Use Cases retornam Result — nunca lançam exceção para a camada HTTP.
 */
export class Result<T, E extends DomainError = DomainError> {
  private constructor(
    private readonly _value: T | null,
    private readonly _error: E | null
  ) {}

  static ok<T>(value: T): Result<T, never> {
    return new Result(value, null) as Result<T, never>;
  }

  static fail<E extends DomainError>(error: E): Result<never, E> {
    return new Result(null, error) as Result<never, E>;
  }

  get isSuccess(): boolean {
    return this._error === null;
  }

  get isFailure(): boolean {
    return this._error !== null;
  }

  get value(): T {
    if (this._error !== null) throw this._error;
    return this._value as T;
  }

  get error(): E {
    if (this._error === null) throw new Error('Result has no error');
    return this._error;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return this._error !== null
      ? (this as unknown as Result<U, E>)
      : Result.ok(fn(this._value as T));
  }

  mapError<F extends DomainError>(fn: (error: E) => F): Result<T, F> {
    return this._error === null ? (this as unknown as Result<T, F>) : Result.fail(fn(this._error));
  }
}
