/**
 * Internal exceptions thrown inside datasources (mock or local/SQLite).
 * Repositories catch these at the boundary and map them to a typed Failure
 * (see failures.ts) before returning a Result to callers — UI code should
 * never see these directly.
 */
export class AppException extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = new.target.name;
  }
}

export class DatabaseException extends AppException {}

export class NotFoundException extends AppException {}

export class ValidationException extends AppException {
  constructor(message: string, readonly fieldErrors?: Record<string, string>) {
    super(message);
  }
}

export class NetworkException extends AppException {}

export class BackupException extends AppException {}
