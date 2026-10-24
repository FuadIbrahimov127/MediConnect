import { ApiError } from '../core/errors';
import { faults } from './faults';

// Antivirus servisinin mock-u (BR-501-05, NFR-08). Demo üçün: EICAR test imzası və ya adında "virus" olan fayl zərərli sayılır.

const EICAR = 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE';

export function scan(buffer: Buffer, fileName: string): 'CLEAN' | 'INFECTED' {
  if (faults.get('antivirus') !== 'ok') throw new ApiError('ServiceUnavailable');
  if (buffer.includes(EICAR) || /virus/i.test(fileName)) return 'INFECTED';
  return 'CLEAN';
}

/** Faylın həqiqi növünü məzmuna görə müəyyən edir (uzantıya etibar olunmur). */
export function sniffMime(buffer: Buffer): 'application/pdf' | 'image/png' | 'image/jpeg' | null {
  if (buffer.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  return null;
}
