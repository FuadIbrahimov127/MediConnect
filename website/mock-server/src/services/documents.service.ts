import type { AccessLogDto, DocumentCategory, DocumentDto, SharedDocumentsDto, SignedUrlDto } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { denyAccess } from '../core/access';
import { audit, securityEvent } from '../core/audit';
import { addDays, addMinutes, clock } from '../core/clock';
import { randomToken } from '../core/crypto';
import { ApiError } from '../core/errors';
import { getSetting } from '../core/settings';
import { scan, sniffMime } from '../integrations/antivirus';
import { destroy, getDecrypted, putEncrypted } from '../integrations/storage';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { MedicalDocument } from '../store/types';
import { ownDocument, refreshGrant } from './grants.service';
import { requireMedicalConsent } from './profile.service';
import { doctorFullName } from './visibility';

// UC-501 yükləmə və təşkil, UC-503 həkimin baxışı. Fayllar AES-256-GCM ilə şifrələnir (BR-501-02),
// fayla giriş yalnız qısamüddətli, birdəfəlik signed URL ilə (BR-501-08, BR-503-05). Hər baxış log-a yazılır (BR-502-05).

function myPatientId(actor: Actor): string {
  const p = db.patients.find((x) => x.userId === actor.userId);
  if (!p) throw new ApiError('Forbidden');
  return p.patientId;
}

const purgeAt = (d: MedicalDocument) => (d.deletedAt ? addDays(new Date(d.deletedAt), getSetting('document_soft_delete_days')).toISOString() : null);

export function toDocumentDto(d: MedicalDocument): DocumentDto {
  const grants = db.document_access_grants.filter((g) => g.documentId === d.documentId);
  return {
    documentId: d.documentId,
    category: d.category,
    fileName: d.fileName,
    mimeType: d.mimeType,
    fileSizeBytes: d.fileSizeBytes,
    documentDate: d.documentDate,
    description: d.description,
    isArchived: d.isArchived,
    uploadedAt: d.uploadedAt,
    deletedAt: d.deletedAt,
    purgeAt: purgeAt(d),
    activeGrants: grants.filter((g) => refreshGrant(g).status === 'ACTIVE').length,
    totalViews: grants.reduce((n, g) => n + g.viewCount, 0),
  };
}

/** Faylın özünü saxlamadan əvvəlki bütün yoxlamalar (FR-501-01..10). */
export function storeDocument(
  actor: Actor,
  patientId: string,
  file: { buffer: Buffer; originalname: string; size: number },
  meta: { category: DocumentCategory; documentDate?: string; description?: string },
): MedicalDocument {
  if (file.size > getSetting('max_file_size_mb') * 1024 * 1024) throw new ApiError('FileTooLarge'); // EF-501-2
  const mime = sniffMime(file.buffer);
  if (!mime) throw new ApiError('UnsupportedFileType'); // EF-501-1 — uzantıya yox, məzmuna baxılır
  if (scan(file.buffer, file.originalname) === 'INFECTED') {
    // EF-501-3: rədd edilir, təhlükəsizlik log-una yazılır.
    securityEvent(actor, 'MALWARE_DETECTED', 'HIGH', `Zərərli fayl yükləmə cəhdi: ${file.originalname}`);
    throw new ApiError('MalwareDetected');
  }
  const { storagePath, encryptionKeyId } = putEncrypted(file.buffer);
  const doc: MedicalDocument = {
    documentId: newId(),
    patientId,
    category: meta.category,
    fileName: file.originalname.slice(0, 255),
    storagePath,
    fileSizeBytes: file.size,
    mimeType: mime,
    encryptionKeyId,
    documentDate: meta.documentDate ?? null,
    description: meta.description?.trim() || null,
    virusScanStatus: 'CLEAN',
    isArchived: false,
    uploadedAt: clock.nowIso(),
    deletedAt: null,
  };
  db.medical_documents.push(doc);
  return doc;
}

export function uploadDocument(actor: Actor, file: { buffer: Buffer; originalname: string; size: number } | undefined, meta: { category: DocumentCategory; documentDate?: string; description?: string }): DocumentDto {
  requireMedicalConsent(actor.userId!); // EF-501-6, BR-501-07
  if (!file) throw new ApiError('ValidationError', { fields: { file: 'validation.required' } });
  const doc = storeDocument(actor, myPatientId(actor), file, meta);
  audit(actor, { action: 'UPLOAD_DOCUMENT', entityType: 'DOCUMENT', entityId: doc.documentId, newValue: { category: doc.category, fileName: doc.fileName, size: doc.fileSizeBytes } });
  return toDocumentDto(doc);
}

export function listDocuments(actor: Actor, q: { category?: DocumentCategory; archived?: 'true' | 'false'; deleted?: 'true' | 'false'; q?: string; sort: 'NEWEST' | 'OLDEST' | 'DOCUMENT_DATE' }): DocumentDto[] {
  const pid = myPatientId(actor);
  const needle = q.q?.toLocaleLowerCase('az');
  return db.medical_documents
    .filter((d) => d.patientId === pid)
    .filter((d) => (q.deleted === 'true' ? !!d.deletedAt : !d.deletedAt))
    .filter((d) => q.deleted === 'true' || (q.archived === 'true' ? d.isArchived : q.archived === 'false' ? !d.isArchived : true))
    .filter((d) => !q.category || d.category === q.category)
    .filter((d) => !needle || `${d.fileName} ${d.description ?? ''}`.toLocaleLowerCase('az').includes(needle))
    .sort((a, b) =>
      q.sort === 'OLDEST' ? a.uploadedAt.localeCompare(b.uploadedAt) : q.sort === 'NEWEST' ? b.uploadedAt.localeCompare(a.uploadedAt) : (b.documentDate ?? b.uploadedAt).localeCompare(a.documentDate ?? a.uploadedAt),
    )
    .map(toDocumentDto);
}

export function updateDocument(actor: Actor, documentId: string, patch: { category?: DocumentCategory; documentDate?: string | null; description?: string | null; isArchived?: boolean }): DocumentDto {
  requireMedicalConsent(actor.userId!);
  const d = ownDocument(actor, documentId);
  if (d.deletedAt) throw new ApiError('NotFound');
  const old = { category: d.category, documentDate: d.documentDate, description: d.description, isArchived: d.isArchived };
  Object.assign(d, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)));
  audit(actor, { action: patch.isArchived !== undefined && Object.keys(patch).length === 1 ? (patch.isArchived ? 'ARCHIVE_DOCUMENT' : 'UNARCHIVE_DOCUMENT') : 'UPDATE_DOCUMENT', entityType: 'DOCUMENT', entityId: documentId, oldValue: old, newValue: patch });
  return toDocumentDto(d);
}

/** UC-501 alt 4: soft delete (30 gün), aktiv icazələr bağlanır — həkim artıq görmür (EF-503-5). */
export function deleteDocument(actor: Actor, documentId: string): DocumentDto {
  const d = ownDocument(actor, documentId);
  if (d.deletedAt) throw new ApiError('NotFound');
  d.deletedAt = clock.nowIso();
  for (const g of db.document_access_grants) if (g.documentId === documentId && g.status === 'ACTIVE') Object.assign(g, { status: 'REVOKED', revokedAt: clock.nowIso() });
  audit(actor, { action: 'DELETE_DOCUMENT', entityType: 'DOCUMENT', entityId: documentId });
  return toDocumentDto(d);
}

export function restoreDocument(actor: Actor, documentId: string): DocumentDto {
  const d = ownDocument(actor, documentId);
  if (!d.deletedAt) throw new ApiError('InvalidStatusTransition');
  d.deletedAt = null;
  audit(actor, { action: 'RESTORE_DOCUMENT', entityType: 'DOCUMENT', entityId: documentId });
  return toDocumentDto(d);
}

/** Scheduled job: soft delete müddəti bitən sənədlər tam silinir (fayl + açar + metadata). */
export function purgeDeletedDocuments(): number {
  const limit = getSetting('document_soft_delete_days') * 86_400_000;
  const expired = db.medical_documents.filter((d) => d.deletedAt && clock.nowMs() - new Date(d.deletedAt).getTime() >= limit);
  for (const d of expired) destroy(d.storagePath, d.encryptionKeyId);
  const ids = new Set(expired.map((d) => d.documentId));
  db.medical_documents = db.medical_documents.filter((d) => !ids.has(d.documentId));
  db.document_access_grants = db.document_access_grants.filter((g) => !ids.has(g.documentId));
  db.appointment_documents = db.appointment_documents.filter((x) => !ids.has(x.documentId));
  return expired.length;
}

// ── Baxış: signed URL ──

function issueSignedUrl(d: MedicalDocument, userId: string, downloadAllowed: boolean): SignedUrlDto {
  const token = randomToken(24);
  const expiresAt = addMinutes(clock.now(), getSetting('signed_url_ttl_seconds') / 60).toISOString();
  db.signed_urls.push({ token, documentId: d.documentId, userId, expiresAt, usedAt: null });
  return { url: `/v1/files/${token}${downloadAllowed ? '' : '?inline=1'}`, expiresAt, downloadAllowed, mimeType: d.mimeType, fileName: d.fileName };
}

/** Pasient öz sənədinə baxır (və yükləyə bilər); həkim yalnız ACTIVE icazə ilə və yalnız baxır (UC-503). */
export function viewDocument(actor: Actor, documentId: string, ip: string | null): SignedUrlDto {
  const d = db.medical_documents.find((x) => x.documentId === documentId);
  if (actor.role === 'PATIENT') {
    const own = ownDocument(actor, documentId);
    if (own.deletedAt) throw new ApiError('NotFound');
    requireMedicalConsent(actor.userId!);
    audit(actor, { action: 'VIEW_DOCUMENT', entityType: 'DOCUMENT', entityId: documentId });
    return issueSignedUrl(own, actor.userId!, true);
  }
  if (actor.role !== 'DOCTOR') denyAccess(actor, `sənəd ${documentId}`); // klinika admini / super admin — heç vaxt (BR-502-08/09)
  const doctor = db.doctors.find((x) => x.userId === actor.userId)!;
  const grants = db.document_access_grants.filter((g) => g.documentId === documentId && g.doctorId === doctor.doctorId).map(refreshGrant);
  const active = grants.find((g) => g.status === 'ACTIVE');
  const log = (accessType: 'VIEW' | 'DENIED', grantId: string | null) =>
    db.document_access_log.push({ accessLogId: newId(), documentId, grantId, accessedBy: actor.userId!, accessType, ipAddress: ip, accessedAt: clock.nowIso() });
  if (!d || d.deletedAt || !grants.length) {
    if (d) log('DENIED', null);
    denyAccess(actor, `sənəd ${documentId}`); // EF-503-4 / EF-503-5
  }
  if (!active) {
    // EF-503-1 / EF-503-2: müddət bitib və ya ləğv edilib.
    log('DENIED', grants.at(-1)?.grantId ?? null);
    securityEvent(actor, 'UNAUTHORIZED_ACCESS', 'LOW', `Müddəti bitmiş/ləğv edilmiş icazə ilə sənəd cəhdi: ${documentId}`);
    throw new ApiError('AccessGrantExpired');
  }
  active.viewCount++;
  log('VIEW', active.grantId);
  audit(actor, { action: 'VIEW_DOCUMENT', entityType: 'DOCUMENT', entityId: documentId, newValue: { grantId: active.grantId } });
  return issueSignedUrl(d, actor.userId!, false);
}

/** EF-503-3: həkimin yükləmə cəhdi bloklanır və log-a "DOWNLOAD_ATTEMPT" kimi yazılır. */
export function downloadAttempt(actor: Actor, documentId: string, ip: string | null): never {
  const doctor = db.doctors.find((x) => x.userId === actor.userId);
  const grant = doctor && db.document_access_grants.find((g) => g.documentId === documentId && g.doctorId === doctor.doctorId);
  if (!grant) denyAccess(actor, `sənəd ${documentId}`);
  db.document_access_log.push({ accessLogId: newId(), documentId, grantId: grant.grantId, accessedBy: actor.userId!, accessType: 'DOWNLOAD_ATTEMPT', ipAddress: ip, accessedAt: clock.nowIso() });
  securityEvent(actor, 'UNAUTHORIZED_ACCESS', 'LOW', `Sənədi yükləmə cəhdi (qadağandır): ${documentId}`);
  throw new ApiError('DownloadNotAllowed');
}

/** /v1/files/{token} — birdəfəlik və qısamüddətli (BR-503-05). Qaytarır: deşifrə edilmiş fayl. */
export function consumeSignedUrl(token: string): { doc: MedicalDocument; body: Buffer } {
  const s = db.signed_urls.find((x) => x.token === token);
  if (!s || s.usedAt || new Date(s.expiresAt).getTime() <= clock.nowMs()) throw new ApiError('Forbidden');
  s.usedAt = clock.nowIso();
  const doc = db.medical_documents.find((d) => d.documentId === s.documentId);
  if (!doc || doc.deletedAt) throw new ApiError('NotFound');
  return { doc, body: getDecrypted(doc.storagePath, doc.encryptionKeyId) };
}

/** BR-502-06: pasient öz sənədinə kimin baxdığını görür. */
export function accessLog(actor: Actor, documentId: string): AccessLogDto[] {
  ownDocument(actor, documentId);
  return db.document_access_log
    .filter((l) => l.documentId === documentId)
    .sort((a, b) => b.accessedAt.localeCompare(a.accessedAt))
    .map((l) => {
      const u = db.users.find((x) => x.userId === l.accessedBy);
      const doctor = u && db.doctors.find((d) => d.userId === u.userId);
      return { accessLogId: l.accessLogId, accessedBy: doctor ? doctorFullName(doctor) : u ? `${u.firstName} ${u.lastName}` : '—', role: u?.role ?? '', accessType: l.accessType, accessedAt: l.accessedAt };
    });
}

// ── Həkim tərəfi (UC-503) ──

/** Həkimə yalnız aktiv icazəli, silinməmiş sənədlər (BR-503-01, FR-503-12). */
export function sharedWithDoctor(actor: Actor, patientId: string): SharedDocumentsDto {
  const doctor = db.doctors.find((x) => x.userId === actor.userId);
  const patient = db.patients.find((p) => p.patientId === patientId);
  if (!doctor || !patient) throw new ApiError('NotFound');
  // Həkim yalnız randevusu olan pasientin səhifəsini aça bilər.
  const dcIds = new Set(db.doctor_clinics.filter((x) => x.doctorId === doctor.doctorId).map((x) => x.doctorClinicId));
  if (!db.appointments.some((a) => a.patientId === patientId && dcIds.has(a.doctorClinicId))) denyAccess(actor, `pasient ${patientId}`);
  const u = db.users.find((x) => x.userId === patient.userId)!;
  const documents = db.document_access_grants
    .filter((g) => g.doctorId === doctor.doctorId && g.grantedBy === patientId && refreshGrant(g).status === 'ACTIVE')
    .map((g) => ({ g, d: db.medical_documents.find((x) => x.documentId === g.documentId)! }))
    .filter(({ d }) => d && !d.deletedAt)
    .map(({ g, d }) => ({ documentId: d.documentId, grantId: g.grantId, fileName: d.fileName, category: d.category, mimeType: d.mimeType, documentDate: d.documentDate, description: d.description, expiresAt: g.expiresAt }));
  return { patient: { patientId, fullName: `${u.firstName} ${u.lastName}` }, documents };
}
