import { hmac } from '../core/crypto';
import { faults } from './faults';

// Rəqəmsal imza servisinin mock-u (UC-601). Real sertifikat yoxdur: imza = HMAC(həkim + reseptin məzmun hash-i).
// Dev panel → "Nasazlıqlar" → signature: 'down' / 'error' halında xəta atılır (EF-601-6).

export class SignatureServiceError extends Error {}

export function signPrescription(doctorId: string, payloadHash: string): string {
  const mode = faults.get('signature');
  if (mode !== 'ok') throw new SignatureServiceError(mode === 'down' ? 'İmza servisi cavab vermir' : 'İmza servisi xəta qaytardı');
  return `MC-SIG-v1:${hmac(`${doctorId}|${payloadHash}`)}`;
}

export function verifyPrescriptionSignature(doctorId: string, payloadHash: string, signature: string | null): boolean {
  return !!signature && signature === `MC-SIG-v1:${hmac(`${doctorId}|${payloadHash}`)}`;
}
