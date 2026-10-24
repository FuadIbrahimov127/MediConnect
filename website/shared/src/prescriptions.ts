import { z } from 'zod';
import type { AllergySeverity, Gender, InteractionSeverity, PrescriptionStatus } from './enums';
import { userPinSchema } from './schemas';

// Modul 6 — E-Prescription (UC-601, UC-602).

export const PRESCRIPTION_STATUS_LABEL: Record<PrescriptionStatus, string> = {
  DRAFT: 'Qaralama',
  SIGNED: 'Aktiv',
  EXPIRED: 'Müddəti bitib',
  CANCELLED: 'Ləğv edilib',
  DISPENSED: 'Verilib',
};

export const ALLERGY_SEVERITY_LABEL: Record<AllergySeverity, string> = { MILD: 'Yüngül', MODERATE: 'Orta', SEVERE: 'Ağır' };

export const INTERACTION_SEVERITY_LABEL: Record<InteractionSeverity, string> = {
  MINOR: 'Zəif',
  MODERATE: 'Orta',
  SEVERE: 'Ağır',
};

/** Qaralamada sahələr boş ola bilər — tamlıq imzalanarkən yoxlanılır (EF-601-5). */
export const medicationInputSchema = z.object({
  drugId: z.string().uuid().nullable(),
  drugNameManual: z.string().trim().max(150).nullable(),
  dosage: z.string().trim().max(100),
  frequency: z.string().trim().max(100),
  durationDays: z.number().int().min(1).max(365).nullable(),
  instructions: z.string().trim().max(500).nullable(),
});
export type MedicationInput = z.infer<typeof medicationInputSchema>;

export const prescriptionCreateSchema = z.object({
  appointmentId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  copyFromPrescriptionId: z.string().uuid().optional(),
});

export const prescriptionUpdateSchema = z
  .object({
    diagnosis: z.string().trim().max(2000),
    icd10Code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]\d{2}(\.\d{1,2})?$/, 'validation.icd10')
      .nullable(),
    generalNotes: z.string().trim().max(2000).nullable(),
    validDays: z.number().int().min(1).max(365),
    medications: z.array(medicationInputSchema).max(20),
  })
  .partial()
  .strict();

export const prescriptionSignSchema = z.object({
  confirmationPin: userPinSchema,
  overrides: z.array(z.object({ medicationIndex: z.number().int().min(0), reason: z.string().trim().min(10, 'validation.overrideReason').max(500) })).default([]),
  controlledJustification: z.string().trim().min(10, 'validation.overrideReason').max(500).optional(),
});

export const prescriptionCancelSchema = z.object({ reason: z.string().trim().min(5, 'validation.reasonRequired').max(500) });

export const PRESCRIPTION_TAB = ['ACTIVE', 'PAST', 'CANCELLED', 'DRAFT'] as const;
export type PrescriptionTab = (typeof PRESCRIPTION_TAB)[number];
export const prescriptionListSchema = z.object({ tab: z.enum(PRESCRIPTION_TAB).default('ACTIVE'), patientId: z.string().uuid().optional() });

export const renewalRequestSchema = z.object({ note: z.string().trim().max(500).optional() });
export const renewalResolveSchema = z
  .object({ decision: z.enum(['APPROVE', 'REJECT']), reason: z.string().trim().max(500).optional() })
  .refine((v) => v.decision === 'APPROVE' || (v.reason && v.reason.length >= 5), { message: 'validation.reasonRequired', path: ['reason'] });

export const templateCreateSchema = z.object({
  name: z.string().trim().min(2, 'validation.required').max(100),
  medications: z.array(medicationInputSchema).min(1).max(20),
});

export const drugSearchSchema = z.object({ query: z.string().trim().max(100).default('') });

// ── DTO-lar ──

export interface DrugDto {
  drugId: string;
  tradeName: string;
  genericName: string | null;
  form: string | null;
  strength: string | null;
  isControlled: boolean;
}

/** FR-602-12 — məlumatlandırma xarakterli, tibbi məsləhət deyil. */
export interface DrugInfoDto extends DrugDto {
  drugClass: string | null;
  patientInfo: string | null;
}

export type PrescriptionWarningType = 'ALLERGY' | 'INTERACTION' | 'CONTROLLED' | 'MANUAL_DRUG' | 'AGE';

export interface PrescriptionWarningDto {
  type: PrescriptionWarningType;
  severity: InteractionSeverity | AllergySeverity;
  message: string;
  medicationIndex: number;
  /** İmzalamaq üçün səbəbli açıq təsdiq tələb olunurmu (BR-601-09). */
  requiresOverride: boolean;
}

export interface MedicationDto extends MedicationInput {
  name: string;
  form: string | null;
  strength: string | null;
  isControlled: boolean;
  warningOverridden: boolean;
  overrideReason: string | null;
}

export interface PrescriptionDto {
  prescriptionId: string;
  prescriptionNumber: string | null;
  status: PrescriptionStatus;
  appointmentId: string;
  appointmentDate: string;
  diagnosis: string;
  icd10Code: string | null;
  generalNotes: string | null;
  validDays: number;
  validUntil: string | null;
  signedAt: string | null;
  createdAt: string;
  cancelledReason: string | null;
  cancelledAt: string | null;
  signatureValid: boolean;
  qrCodeToken: string | null;
  doctor: { doctorId: string; fullName: string; specialties: string[]; licenseNumber: string };
  clinic: { clinicId: string; name: string; address: string; phone: string | null };
  patient: { patientId: string; fullName: string; fin: string; birthDate: string; age: number; gender: Gender };
  medications: MedicationDto[];
  renewal: { requestId: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; reason: string | null; createdAt: string } | null;
  allowedActions: ('EDIT' | 'SIGN' | 'CANCEL' | 'REQUEST_RENEWAL' | 'DOWNLOAD_PDF' | 'COPY')[];
}

export interface PrescriptionCardDto {
  prescriptionId: string;
  prescriptionNumber: string | null;
  status: PrescriptionStatus;
  date: string;
  validUntil: string | null;
  doctorName: string;
  clinicName: string;
  patientName: string;
  medicationCount: number;
  appointmentId: string;
}

export interface PrescriptionListDto {
  tab: PrescriptionTab;
  counts: Record<PrescriptionTab, number>;
  prescriptions: PrescriptionCardDto[];
}

/** UC-601 — formanın sol paneli: avtodoldurma və klinik təhlükəsizlik konteksti. */
export interface PrescriptionContextDto {
  patient: PrescriptionDto['patient'];
  allergies: { allergenName: string; severity: AllergySeverity }[];
  chronicConditions: { conditionName: string; icd10Code: string | null }[];
  activeMedications: { name: string; source: 'PATIENT' | 'PRESCRIPTION' }[];
  previousPrescriptions: { prescriptionId: string; prescriptionNumber: string | null; date: string; diagnosis: string; medicationCount: number; status: PrescriptionStatus }[];
  templates: TemplateDto[];
  license: { valid: boolean; expiryDate: string };
  signatureCertificate: { valid: boolean; expiryDate: string | null };
  defaultValidDays: number;
}

export interface TemplateDto {
  templateId: string;
  name: string;
  medications: (MedicationInput & { name: string })[];
  createdAt: string;
}

export interface PrescriptionCheckDto {
  warnings: PrescriptionWarningDto[];
  missingFields: Record<string, string>;
}

/** Aptek doğrulaması — tibbi detal yoxdur (BR-602-06). */
export interface PrescriptionVerifyDto {
  prescriptionNumber: string;
  status: PrescriptionStatus;
  valid: boolean;
  signedAt: string;
  validUntil: string;
  doctorName: string;
  clinicName: string;
  patientInitials: string;
  medicationCount: number;
}

export interface RenewalRequestDto {
  requestId: string;
  prescriptionId: string;
  prescriptionNumber: string | null;
  patientId: string;
  patientName: string;
  note: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string | null;
  newPrescriptionId: string | null;
  newAppointmentId: string | null;
  createdAt: string;
  medications: string[];
}
