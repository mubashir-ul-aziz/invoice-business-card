/**
 * Result<T, E> — a typed success/failure wrapper.
 *
 * Repositories and use-cases return this instead of throwing, so failures
 * are values the UI branches on rather than exceptions it must catch.
 * See MVP_BUILD_PLAN.md Section 31 (Error Handling Strategy).
 */
export class Success<T> {
  readonly isSuccess = true as const;
  readonly isFailure = false as const;
  constructor(readonly value: T) {}
}

export class ErrorResult<E> {
  readonly isSuccess = false as const;
  readonly isFailure = true as const;
  constructor(readonly error: E) {}
}

export type Result<T, E = Error> = Success<T> | ErrorResult<E>;

export function ok<T, E = Error>(value: T): Result<T, E> {
  return new Success(value);
}

export function err<T = never, E = Error>(error: E): Result<T, E> {
  return new ErrorResult(error);
}

/** Pattern-match a Result without manually narrowing `isSuccess`. */
export function foldResult<T, E, R>(
  result: Result<T, E>,
  onSuccess: (value: T) => R,
  onFailure: (error: E) => R,
): R {
  return result.isSuccess ? onSuccess(result.value) : onFailure(result.error);
}
