import { z } from 'zod';
import { ACCESS_DURATION, DOCUMENT_CATEGORY, type AccessDuration, type DocumentCategory, type GrantStatus } from './enums';

// Modul 5 — Medical Documents (UC-501..504).

export const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  LAB_RESULT: 'Analiz nəticəsi',
  IMAGING: 'Görüntüləmə',
  EPICRISIS: 'Epikriz / çıxarış',
  PRESCRIPTION: 'Resept',
  OTHER: 'Digər',
};

export const ACCESS_DURATION_LABEL: Record<AccessDuration, string> = {
  TWENTY_FOUR_HOURS: '24 saat',
  SEVEN_DAYS: '7 gün',
  THIRTY_DAYS: '30 gün',
  APPOINTMENT_PERIOD: 'Randevu müddətincə (+7 gün)',
};

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date');

/** Multipart forma sahələri (fayl `file` adı ilə). */
export const documentUploadSchema = z.object({
  category: z.enum(DOCUMENT_CATEGORY),
  documentDate: date.optional().or(z.literal('').transform(() => undefined)),
  description: z.string().trim().max(500).optional(),
});

export const documentUpdateSchema = z
  .object({
    category: z.enum(DOCUMENT_CATEGORY).optional(),
    documentDate: date.nullable().optional(),
    description: z.string().trim().max(500).nullable().optional(),
    isArchived: z.boolean().optional(),
  })
  .strict();

export const documentListSchema = z.object({
  category: z.enum(DOCUMENT_CATEGORY).optional(),
  archived: z.enum(['true', 'false']).optional(),
  deleted: z.enum(['true', 'false']).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['NEWEST', 'OLDEST', 'DOCUMENT_DATE']).default('DOCUMENT_DATE'),
});

export const grantCreateSchema = z.object({ doctorId: z.string().uuid(), accessDuration: z.enum(ACCESS_DURATION) });
export const grantBulkSchema = z.object({ documentIds: z.array(z.string().uuid()).min(1).max(20), doctorId: z.string().uuid(), accessDuration: z.enum(ACCESS_DURATION) });
export const grantExtendSchema = z.object({ accessDuration: z.enum(ACCESS_DURATION) });
export const appointmentDocumentsSchema = z.object({ documentIds: z.array(z.string().uuid()).min(1).max(10) });

export interface DocumentDto {
  documentId: string;
  category: DocumentCategory;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  documentDate: string | null;
  description: string | null;
  isArchived: boolean;
  uploadedAt: string;
  deletedAt: string | null;
  /** Soft delete: tam silinmə tarixi (BR-501-06). */
  purgeAt: string | null;
  activeGrants: number;
  totalViews: number;
}

export interface EligibleDoctorDto {
  doctorId: string;
  fullName: string;
  specialties: string[];
  lastAppointmentDate: string;
  /** Bu sənəd üçün aktiv icazə varsa (EF-502-2). */
  existingGrantId: string | null;
}

export interface GrantDto {
  grantId: string;
  documentId: string;
  documentName: string;
  category: DocumentCategory;
  doctorId: string;
  doctorName: string;
  accessDuration: AccessDuration;
  status: GrantStatus;
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  viaAppointment: boolean;
}

export interface AccessLogDto {
  accessLogId: string;
  accessedBy: string;
  role: string;
  accessType: 'VIEW' | 'DOWNLOAD_ATTEMPT' | 'DENIED';
  accessedAt: string;
}

export interface SignedUrlDto {
  url: string;
  expiresAt: string;
  /** Həkim üçün false — yalnız platforma daxilində baxış (BR-502-04). */
  downloadAllowed: boolean;
  mimeType: string;
  fileName: string;
}

export interface SharedDocumentDto {
  documentId: string;
  grantId: string;
  fileName: string;
  category: DocumentCategory;
  mimeType: string;
  documentDate: string | null;
  description: string | null;
  expiresAt: string;
}

export interface SharedDocumentsDto {
  patient: { patientId: string; fullName: string };
  documents: SharedDocumentDto[];
}

export type TimelineType = 'APPOINTMENT' | 'PRESCRIPTION' | 'DOCUMENT';

export const timelineQuerySchema = z.object({
  type: z.enum(['APPOINTMENT', 'PRESCRIPTION', 'DOCUMENT']).optional(),
  from: date.optional(),
  to: date.optional(),
  doctorId: z.string().uuid().optional(),
  clinicId: z.string().uuid().optional(),
});

export interface TimelineEventDto {
  eventId: string;
  type: TimelineType;
  date: string;
  title: string;
  description: string | null;
  doctorId: string | null;
  doctorName: string | null;
  clinicId: string | null;
  clinicName: string | null;
  /** Detal səhifəsinə keçid (FR-504-09). */
  link: string | null;
}

export interface TimelineDto {
  patient: { fullName: string; birthDate: string; bloodType: string | null; allergies: string[]; chronicConditions: string[] };
  events: TimelineEventDto[];
  filters: { doctors: { id: string; name: string }[]; clinics: { id: string; name: string }[] };
}
