/**
 * Typed failures carried inside Result<T, Failure> (Section 31). The UI's
 * shared ErrorState component branches on `kind`/message rather than
 * string-matching a raw Error, and network-origin failures are always
 * distinguishable from local-data failures so messaging can reassure the
 * user their local data is safe.
 */
export type FailureKind =
  | 'database'
  | 'validation'
  | 'network'
  | 'backup'
  | 'notFound'
  | 'unknown';

export abstract class Failure {
  protected constructor(
    readonly kind: FailureKind,
    readonly message: string,
    readonly cause?: unknown,
  ) {}
}

export class DatabaseFailure extends Failure {
  constructor(message = 'A local database error occurred.', cause?: unknown) {
    super('database', message, cause);
  }
}

export class ValidationFailure extends Failure {
  constructor(message: string, readonly fieldErrors?: Record<string, string>) {
    super('validation', message);
  }
}

export class NetworkFailure extends Failure {
  constructor(message = 'A network error occurred. Your local data is safe.', cause?: unknown) {
    super('network', message, cause);
  }
}

export class BackupFailure extends Failure {
  constructor(message = 'Backup or restore did not complete.', cause?: unknown) {
    super('backup', message, cause);
  }
}

export class NotFoundFailure extends Failure {
  constructor(message = 'The requested item could not be found.') {
    super('notFound', message);
  }
}

export class UnknownFailure extends Failure {
  constructor(message = 'Something went wrong.', cause?: unknown) {
    super('unknown', message, cause);
  }
}
