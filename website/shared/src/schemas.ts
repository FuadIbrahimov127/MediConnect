import { z } from 'zod';

// Ortaq sahə sxemləri — spec "Parameters" bölməsi. Client formları və server validasiyası eyni sxemi istifadə edir.
// Mesajlar i18n açarlarıdır (client tərcümə edir, server ValidationError.details.fields-ə qoyur).

export const mobileNumberSchema = z
  .string()
  .trim()
  .regex(/^\+994\d{9}$/, 'validation.mobileNumber');

/** FIN — 7 simvol, böyük hərf + rəqəm. Spec API adı: `pin` (qeydiyyatda). */
export const finSchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{7}$/, 'validation.fin'));

export const otpCodeSchema = z.string().regex(/^\d{6}$/, 'validation.otpCode');

const WEAK_PINS = new Set(['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '0123', '9876', '2345', '3456', '4567', '5678', '6789']);

export const isWeakPin = (pin: string) => WEAK_PINS.has(pin);

/** 4 rəqəmli PIN kod (spec API adı: `userPin`). Zəiflik yoxlaması ayrıca (WeakPin biznes xətası). */
export const userPinSchema = z.string().regex(/^\d{4}$/, 'validation.userPin');

export const uuidSchema = z.string().uuid('validation.uuid');

export const returnUrlSchema = z
  .string()
  .max(500)
  .refine((v) => v.startsWith('/') && !v.startsWith('//'), 'validation.returnUrl');

export const reasonSchema = z.string().trim().min(3, 'validation.reasonRequired').max(500);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(20).default(20),
});

/** Query-də vergüllə ayrılmış massiv: ?ids=a,b */
export const csvArray = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (typeof v === 'string' ? v.split(',').filter(Boolean) : v), z.array(item));
