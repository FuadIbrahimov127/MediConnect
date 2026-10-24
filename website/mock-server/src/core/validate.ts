import type { Request } from 'express';
import type { z } from 'zod';

// Route-larda: const body = parseBody(req, schema). ZodError errorHandler-də ValidationError-a çevrilir.

export const parseBody = <S extends z.ZodTypeAny>(req: Request, schema: S): z.infer<S> => schema.parse(req.body ?? {});
export const parseQuery = <S extends z.ZodTypeAny>(req: Request, schema: S): z.infer<S> => schema.parse(req.query ?? {});
