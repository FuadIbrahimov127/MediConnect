import { ERROR_HTTP, type ErrorType } from '@mediconnect/shared';

/** Biznes və ya HTTP xətası. Service qatı atır, errorHandler zərfə çevirir. */
export class ApiError extends Error {
  readonly http: number;

  constructor(
    readonly errorType: ErrorType,
    readonly details?: Record<string, unknown>,
    /** messages.ts-dəki mətni əvəz etmək lazım olanda (nadir hallarda). */
    readonly messageOverride?: string,
  ) {
    super(errorType);
    this.http = ERROR_HTTP[errorType];
  }
}

export const notFound = () => new ApiError('NotFound');
export const forbidden = () => new ApiError('Forbidden');
