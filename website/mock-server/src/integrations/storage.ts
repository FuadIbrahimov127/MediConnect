import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';
import { ApiError } from '../core/errors';
import { newId } from '../store/repo';
import { faults } from './faults';

// Şifrələnmiş fayl storage-ı (BR-501-02, NFR-02): hər sənəd öz AES-256-GCM açarı ilə şifrələnir.
// Açarlar sənəddən ayrı "keyring"-də saxlanılır (FR-501-24) — bazada yalnız açar referensi (encryptionKeyId) olur.
// Persist rejimində: data/storage/{id}.enc və data/keys.json. Testlərdə (persist=false) yaddaşda.

const memFiles = new Map<string, Buffer>();
let keyring: Record<string, string> | null = null;

const storageDir = () => path.join(config.dataDir, 'storage');
const keysFile = () => path.join(config.dataDir, 'keys.json');

function keys(): Record<string, string> {
  if (keyring) return keyring;
  keyring = config.persist && fs.existsSync(keysFile()) ? (JSON.parse(fs.readFileSync(keysFile(), 'utf8')) as Record<string, string>) : {};
  return keyring;
}

function saveKeys() {
  if (!config.persist) return;
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(keysFile(), JSON.stringify(keys()));
}

function assertUp() {
  if (faults.get('storage') !== 'ok') throw new ApiError('ServiceUnavailable'); // EF-501-5
}

/** Faylı şifrələyib saxlayır. Qaytarır: storagePath və açar referensi. */
export function putEncrypted(plain: Buffer): { storagePath: string; encryptionKeyId: string } {
  assertUp();
  const encryptionKeyId = `key_${newId()}`;
  const key = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const blob = Buffer.concat([iv, cipher.getAuthTag(), enc]);
  const storagePath = `${newId()}.enc`;
  if (config.persist) {
    fs.mkdirSync(storageDir(), { recursive: true });
    fs.writeFileSync(path.join(storageDir(), storagePath), blob);
  } else memFiles.set(storagePath, blob);
  keys()[encryptionKeyId] = key.toString('hex');
  saveKeys();
  return { storagePath, encryptionKeyId };
}

export function getDecrypted(storagePath: string, encryptionKeyId: string): Buffer {
  assertUp();
  const blob = config.persist ? fs.readFileSync(path.join(storageDir(), storagePath)) : memFiles.get(storagePath);
  const keyHex = keys()[encryptionKeyId];
  if (!blob || !keyHex) throw new ApiError('NotFound');
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), blob.subarray(0, 12));
  decipher.setAuthTag(blob.subarray(12, 28));
  return Buffer.concat([decipher.update(blob.subarray(28)), decipher.final()]);
}

/** Tam silinmə (soft delete müddəti bitdikdən sonra): fayl və açar məhv edilir. */
export function destroy(storagePath: string, encryptionKeyId: string) {
  if (config.persist) fs.rmSync(path.join(storageDir(), storagePath), { force: true });
  else memFiles.delete(storagePath);
  delete keys()[encryptionKeyId];
  saveKeys();
}

/** Dev reset / seed zamanı storage sıfırlanır. */
export function resetStorage() {
  memFiles.clear();
  keyring = {};
  if (config.persist) {
    fs.rmSync(storageDir(), { recursive: true, force: true });
    saveKeys();
  }
}

/** Şifrələnmiş faylın içində açıq mətn olmadığını yoxlamaq üçün (testlər). */
export function rawBlob(storagePath: string): Buffer | undefined {
  return config.persist ? fs.readFileSync(path.join(storageDir(), storagePath)) : memFiles.get(storagePath);
}
