import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config';

export const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const randomDigits = (len: number) => Array.from({ length: len }, () => randomInt(0, 10)).join('');

/** PIN və OTP hash-i (NFR-03: bcrypt). Mock-da sürət üçün cost 8. */
export const hashSecret = (v: string) => bcrypt.hashSync(v, 8);
export const verifySecret = (v: string, hash: string) => bcrypt.compareSync(v, hash);

export const hmac = (payload: string) => createHmac('sha256', config.secret).update(payload).digest('hex');

export function verifyHmac(payload: string, signature: string): boolean {
  const expected = Buffer.from(hmac(payload), 'hex');
  const given = Buffer.from(signature, 'hex');
  return expected.length === given.length && timingSafeEqual(expected, given);
}
