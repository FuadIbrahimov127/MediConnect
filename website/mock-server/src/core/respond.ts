import type { ApiErrorBody, ApiSuccess } from '@mediconnect/shared';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { clock } from './clock';
import { ApiError } from './errors';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, VALIDATION_MESSAGES, pick, type SuccessKey } from './messages';

export function ok<T>(req: Request, res: Response, data: T, opts: { message?: SuccessKey; http?: number } = {}) {
  const body: ApiSuccess<T> = { status: 'SUCCESS', data };
  if (opts.message) body.message = pick(SUCCESS_MESSAGES[opts.message], req.lang);
  res.status(opts.http ?? 200).json(body);
}

export const created = <T>(req: Request, res: Response, data: T, message?: SuccessKey) => ok(req, res, data, { message, http: 201 });

function zodFields(err: ZodError, req: Request) {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (fields[key]) continue;
    const m = VALIDATION_MESSAGES[issue.message];
    fields[key] = m ? pick(m, req.lang) : issue.message;
  }
  return fields;
}

// Express 5 async xətaları da bura ötürür.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let apiErr: ApiError;
  if (err instanceof ApiError) apiErr = err;
  else if (err instanceof ZodError) apiErr = new ApiError('ValidationError', { fields: zodFields(err, req) });
  else if (err && typeof err === 'object' && (err as { name?: string }).name === 'MulterError') apiErr = new ApiError((err as { code?: string }).code === 'LIMIT_FILE_SIZE' ? 'FileTooLarge' : 'ValidationError');
  else if (err && typeof err === 'object' && 'type' in err && (err as { type: string }).type === 'entity.parse.failed') apiErr = new ApiError('ValidationError');
  else {
    console.error('[mock-server] gözlənilməz xəta:', err);
    apiErr = new ApiError('ServerError');
  }
  const body: ApiErrorBody = {
    status: 'ERROR',
    errorType: apiErr.errorType,
    message: apiErr.messageOverride ?? pick(ERROR_MESSAGES[apiErr.errorType], req.lang ?? 'az'),
    timestamp: clock.nowIso(),
  };
  if (apiErr.details) {
    body.details = apiErr.details;
    // Service qatı sahə xətalarını açar kimi verə bilər ('validation.consent') — istifadəçi dilinə çevir.
    const fields = apiErr.details.fields as Record<string, string> | undefined;
    if (fields) {
      body.details = {
        ...apiErr.details,
        fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, VALIDATION_MESSAGES[v] ? pick(VALIDATION_MESSAGES[v], req.lang ?? 'az') : v])),
      };
    }
  }
  res.status(apiErr.http).json(body);
}
