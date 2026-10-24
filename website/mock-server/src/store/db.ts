import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';
import type * as T from './types';

// In-memory store. Kolleksiya adları DB cədvəlləri ilə eynidir (snake_case), qeyd sahələri camelCase-dir.
// Bütün əməliyyatlar sinxrondur — Node tək thread olduğu üçün "yoxla → yaz" atomikdir (soft lock üçün vacib).

export interface DbSchema {
  users: T.User[];
  patients: T.Patient[];
  patient_allergies: T.PatientAllergy[];
  patient_chronic_conditions: T.PatientChronicCondition[];
  user_sessions: T.UserSession[];
  otp_verifications: T.OtpVerification[];
  sima_verification_sessions: T.SimaVerificationSession[];
  doctors: T.Doctor[];
  specialties: T.Specialty[];
  doctor_specialties: T.DoctorSpecialty[];
  doctor_languages: T.DoctorLanguage[];
  clinics: T.Clinic[];
  clinic_admins: T.ClinicAdmin[];
  clinic_working_hours: T.ClinicWorkingHour[];
  clinic_photos: T.ClinicPhoto[];
  clinic_holidays: T.ClinicHoliday[];
  clinic_documents: T.ClinicDocument[];
  service_requests: T.ServiceRequest[];
  doctor_credentials: T.DoctorCredential[];
  doctor_clinics: T.DoctorClinic[];
  services: T.Service[];
  clinic_doctor_services: T.ClinicDoctorService[];
  doctor_schedules: T.DoctorSchedule[];
  schedule_breaks: T.ScheduleBreak[];
  schedule_exceptions: T.ScheduleException[];
  appointment_slots: T.AppointmentSlot[];
  appointments: T.Appointment[];
  appointment_status_history: T.AppointmentStatusHistory[];
  appointment_documents: T.AppointmentDocument[];
  medical_documents: T.MedicalDocument[];
  document_access_grants: T.DocumentAccessGrant[];
  document_access_log: T.DocumentAccessLog[];
  signed_urls: T.SignedUrl[];
  drugs: T.Drug[];
  drug_interactions: T.DrugInteraction[];
  prescriptions: T.Prescription[];
  prescription_medications: T.PrescriptionMedication[];
  prescription_templates: T.PrescriptionTemplate[];
  prescription_renewal_requests: T.PrescriptionRenewalRequest[];
  reviews: T.Review[];
  review_replies: T.ReviewReply[];
  review_reports: T.ReviewReport[];
  moderation_filter_rules: T.ModerationFilterRule[];
  notifications: T.Notification[];
  notification_deliveries: T.NotificationDelivery[];
  scheduled_notifications: T.ScheduledNotification[];
  notification_preferences: T.NotificationPreference[];
  notification_templates: T.NotificationTemplate[];
  audit_logs: T.AuditLog[];
  security_events: T.SecurityEvent[];
  system_settings: T.SystemSetting[];
  cities: T.City[];
  auth_flows: T.AuthFlow[];
  trusted_devices: T.TrustedDevice[];
  dev_outbox: T.OutboxMessage[];
}

export type CollectionName = keyof DbSchema;

const COLLECTIONS: CollectionName[] = [
  'users', 'patients', 'patient_allergies', 'patient_chronic_conditions', 'user_sessions', 'otp_verifications',
  'sima_verification_sessions', 'doctors', 'specialties', 'doctor_specialties', 'doctor_languages', 'clinics',
  'clinic_admins', 'clinic_working_hours', 'clinic_photos', 'clinic_holidays', 'clinic_documents', 'service_requests', 'doctor_credentials', 'doctor_clinics', 'services', 'clinic_doctor_services',
  'doctor_schedules', 'schedule_breaks', 'schedule_exceptions', 'appointment_slots', 'appointments',
  'appointment_status_history', 'appointment_documents', 'medical_documents', 'document_access_grants',
  'document_access_log', 'signed_urls', 'drugs', 'drug_interactions', 'prescriptions', 'prescription_medications',
  'prescription_templates', 'prescription_renewal_requests', 'reviews', 'review_replies', 'review_reports', 'moderation_filter_rules',
  'notifications', 'notification_deliveries', 'scheduled_notifications', 'notification_preferences',
  'notification_templates', 'audit_logs', 'security_events', 'system_settings', 'cities', 'auth_flows',
  'trusted_devices', 'dev_outbox',
];

export function emptyDb(): DbSchema {
  return Object.fromEntries(COLLECTIONS.map((c) => [c, []])) as unknown as DbSchema;
}

/** Canlı store. Modullar `db.users` kimi birbaşa istifadə edir; dəyişiklikdən sonra `db.save()` lazım deyil — middleware çağırır. */
export const db: DbSchema = emptyDb();

const dbFile = () => path.join(config.dataDir, 'db.json');

/** Store-u başqa məzmunla əvəz edir (seed, load, test). Referans eyni qalır. */
export function replaceDb(next: DbSchema) {
  for (const c of COLLECTIONS) {
    (db as unknown as Record<string, unknown[]>)[c] = (next as unknown as Record<string, unknown[]>)[c] ?? [];
  }
}

/** data/db.json mövcuddursa yükləyir; true = yükləndi. */
export function loadDb(): boolean {
  if (!config.persist || !fs.existsSync(dbFile())) return false;
  const raw = JSON.parse(fs.readFileSync(dbFile(), 'utf8')) as Partial<DbSchema>;
  replaceDb({ ...emptyDb(), ...raw });
  return true;
}

let saveTimer: NodeJS.Timeout | null = null;

/** Debounce ilə diskə yazır (500ms). */
export function scheduleSave() {
  if (!config.persist) return;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveNow();
  }, 500);
}

export function saveNow() {
  if (!config.persist) return;
  fs.mkdirSync(config.dataDir, { recursive: true });
  const tmp = `${dbFile()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, dbFile());
}
