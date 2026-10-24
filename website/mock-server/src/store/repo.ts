import { randomUUID } from 'node:crypto';
import { clock } from '../core/clock';
import { ApiError } from '../core/errors';

// Kiçik köməkçilər. Kolleksiyalar adi massivlərdir; burada yalnız təkrarlanan nümunələr var.

export const newId = () => randomUUID();

/** Qeydi kolleksiyaya əlavə edib qaytarır (id və vaxtları çağıran təyin edir: newId(), stamp()). */
export function insert<T extends object>(collection: T[], record: T): T {
  collection.push(record);
  return record;
}

export function stamp() {
  const now = clock.nowIso();
  return { createdAt: now, updatedAt: now };
}

/** Qeydi yerində yeniləyir, updatedAt varsa təzələyir. */
export function update<T extends object>(record: T, patch: Partial<T>): T {
  Object.assign(record, patch);
  if ('updatedAt' in record) (record as { updatedAt: string }).updatedAt = clock.nowIso();
  return record;
}

/** Tapmasa 404 atır. */
export function findOr404<T>(collection: T[], pred: (r: T) => boolean): T {
  const r = collection.find(pred);
  if (!r) throw new ApiError('NotFound');
  return r;
}

export function paginate<T>(items: T[], page: number, size: number) {
  const start = (page - 1) * size;
  return { totalCount: items.length, page, size, items: items.slice(start, start + size) };
}
