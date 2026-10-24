import type {
  DrugDto,
  DrugInfoDto,
  MedicationDto,
  MedicationInput,
  PrescriptionCardDto,
  PrescriptionCheckDto,
  PrescriptionContextDto,
  PrescriptionDto,
  PrescriptionListDto,
  PrescriptionTab,
  PrescriptionVerifyDto,
  PrescriptionWarningDto,
  RenewalRequestDto,
  TemplateDto,
} from '@mediconnect/shared';
import { ALLERGY_SEVERITY_LABEL, INTERACTION_SEVERITY_LABEL } from '@mediconnect/shared';
import { SYSTEM_ACTOR, type Actor } from '../core/actor';
import { denyAccess } from '../core/access';
import { audit } from '../core/audit';
import { addDaysToDate, bakuDate, clock } from '../core/clock';
import { randomToken, sha256, verifySecret } from '../core/crypto';
import { ApiError } from '../core/errors';
import { getSetting } from '../core/settings';
import { SignatureServiceError, signPrescription as signWithService, verifyPrescriptionSignature } from '../integrations/signature';
import { db } from '../store/db';
import { newId, stamp, update } from '../store/repo';
import { makePdf } from '../store/seed-data/files';
import type { Appointment, Doctor, Drug, Patient, Prescription, PrescriptionMedication } from '../store/types';
import { notify } from './notifications.service';
import { doctorFullName } from './visibility';

// UC-601 resept yazma, UC-602 pasientin reseptləri. Status maşını: domain-rules.md → prescriptionStatus.
// Klinika admini və super admin bu modula ümumiyyətlə daxil ola bilmir (BR-600-04) — route səviyyəsində rol yoxlaması.

// ── Kontekst ──

function doctorOf(actor: Actor): Doctor {
  const d = db.doctors.find((x) => x.userId === actor.userId);
  if (!d) throw new ApiError('Forbidden');
  return d;
}

function patientOf(actor: Actor): Patient {
  const p = db.patients.find((x) => x.userId === actor.userId);
  if (!p) throw new ApiError('Forbidden');
  return p;
}

const dcOfAppt = (a: Appointment) => db.doctor_clinics.find((x) => x.doctorClinicId === a.doctorClinicId)!;
const patientUser = (p: Patient) => db.users.find((u) => u.userId === p.userId)!;
const medsOf = (prescriptionId: string) => db.prescription_medications.filter((m) => m.prescriptionId === prescriptionId);
const drugById = (id: string | null) => (id ? db.drugs.find((d) => d.drugId === id) ?? null : null);
const lower = (s: string) => s.toLocaleLowerCase('az');

function age(birthDate: string) {
  const b = new Date(`${birthDate}T00:00:00Z`);
  const n = clock.now();
  let a = n.getUTCFullYear() - b.getUTCFullYear();
  if (n.getUTCMonth() < b.getUTCMonth() || (n.getUTCMonth() === b.getUTCMonth() && n.getUTCDate() < b.getUTCDate())) a--;
  return a;
}

/** BR-601-01: aktiv lisenziya (bitməyib) və hesab VERIFIED. */
function licenseState(doc: Doctor) {
  const user = db.users.find((u) => u.userId === doc.userId)!;
  return { valid: doc.licenseExpiryDate >= bakuDate() && user.status === 'VERIFIED', expiryDate: doc.licenseExpiryDate };
}
const certState = (doc: Doctor) => ({ valid: !!doc.signatureCertExpiry && doc.signatureCertExpiry >= bakuDate(), expiryDate: doc.signatureCertExpiry });

function assertCanPrescribe(doc: Doctor) {
  if (!licenseState(doc).valid) throw new ApiError('LicenseInvalid'); // EF-601-1
}

/** BR-601-02 / EF-601-7: yalnız öz CONFIRMED və ya COMPLETED randevusu üzrə. */
function loadOwnAppointment(actor: Actor, doc: Doctor, appointmentId: string): Appointment {
  const appt = db.appointments.find((a) => a.appointmentId === appointmentId);
  if (!appt || dcOfAppt(appt).doctorId !== doc.doctorId) denyAccess(actor, `appointment:${appointmentId}`);
  if (appt.status !== 'CONFIRMED' && appt.status !== 'COMPLETED')
    throw new ApiError('BusinessRuleViolation', { status: appt.status }, 'Resept yalnız təsdiqlənmiş və ya tamamlanmış randevu üzrə yazıla bilər');
  const patient = db.patients.find((p) => p.patientId === appt.patientId)!;
  if (!patient.medicalConsent) throw new ApiError('ConsentRequired', undefined, 'Pasient tibbi məlumatların emalına razılığını geri götürüb — resept yazmaq mümkün deyil');
  return appt;
}

/** Status oxunanda müddət yoxlanılır (job işləməsə də göstərilən status düzgün olsun — BR-602-04). */
function refreshExpiry(p: Prescription) {
  if (p.status === 'SIGNED' && p.validUntil && p.validUntil < bakuDate()) {
    update(p, { status: 'EXPIRED' });
    audit(SYSTEM_ACTOR, { action: 'PRESCRIPTION_EXPIRED', entityType: 'prescription', entityId: p.prescriptionId });
  }
  return p;
}

/** Sahiblik: həkim yalnız özünün, pasient yalnız özünün və imzalanmış (DRAFT görünmür — BR-602-03). */
function loadPrescription(actor: Actor, id: string): Prescription {
  const p = db.prescriptions.find((x) => x.prescriptionId === id);
  if (!p) return denyAccess(actor, `prescription:${id}`);
  if (actor.role === 'DOCTOR') {
    if (p.doctorId !== doctorOf(actor).doctorId) denyAccess(actor, `prescription:${id}`);
  } else if (actor.role === 'PATIENT') {
    if (p.patientId !== patientOf(actor).patientId || !p.signedAt) denyAccess(actor, `prescription:${id}`);
  } else denyAccess(actor, `prescription:${id}`);
  return refreshExpiry(p);
}

function loadOwnDraft(actor: Actor, id: string): Prescription {
  if (actor.role !== 'DOCTOR') throw new ApiError('Forbidden');
  const p = loadPrescription(actor, id);
  if (p.status !== 'DRAFT') throw new ApiError('PrescriptionNotEditable'); // BR-601-04
  return p;
}

// ── Dərman kataloqu ──

const toDrugDto = (d: Drug): DrugDto => ({ drugId: d.drugId, tradeName: d.tradeName, genericName: d.genericName, form: d.form, strength: d.strength, isControlled: d.isControlled });

export function searchDrugs(query: string): DrugDto[] {
  const q = lower(query.trim());
  return db.drugs
    .filter((d) => d.isActive && (!q || lower(d.tradeName).includes(q) || (d.genericName && lower(d.genericName).includes(q))))
    .sort((a, b) => Number(!lower(a.tradeName).startsWith(q)) - Number(!lower(b.tradeName).startsWith(q)) || a.tradeName.localeCompare(b.tradeName, 'az'))
    .slice(0, 15)
    .map(toDrugDto);
}

export function drugInfo(drugId: string): DrugInfoDto {
  const d = db.drugs.find((x) => x.drugId === drugId);
  if (!d) throw new ApiError('NotFound');
  return { ...toDrugDto(d), drugClass: d.drugClass, patientInfo: d.patientInfo };
}

const medName = (m: { drugId: string | null; drugNameManual: string | null }) => {
  const d = drugById(m.drugId);
  return d ? `${d.tradeName}${d.strength ? ` ${d.strength}` : ''}` : (m.drugNameManual ?? '—');
};

// ── Klinik təhlükəsizlik yoxlamaları (FR-601-19..28) ──

/** Pasientin aktiv dərmanları: özünün qeyd etdiyi daimi dərmanlar + bu həkimin aktiv reseptləri (F22). */
function activeMedications(patient: Patient, doctorId: string, excludePrescriptionId?: string) {
  const list: { name: string; drug: Drug | null; source: 'PATIENT' | 'PRESCRIPTION' }[] = [];
  for (const m of patient.regularMedications) {
    const drug = drugById(m.drugId) ?? db.drugs.find((d) => lower(m.name).includes(lower(d.tradeName)) || (d.genericName && lower(m.name).includes(lower(d.genericName)))) ?? null;
    list.push({ name: m.name, drug, source: 'PATIENT' });
  }
  const own = db.prescriptions.filter(
    (p) => p.patientId === patient.patientId && p.doctorId === doctorId && p.prescriptionId !== excludePrescriptionId && refreshExpiry(p).status === 'SIGNED',
  );
  for (const p of own) for (const m of medsOf(p.prescriptionId)) list.push({ name: medName(m), drug: drugById(m.drugId), source: 'PRESCRIPTION' });
  return list;
}

function interactionBetween(a: string, b: string) {
  return db.drug_interactions.find((i) => (i.drugId1 === a && i.drugId2 === b) || (i.drugId1 === b && i.drugId2 === a));
}

function allergyMatch(patientId: string, drug: Drug | null, manualName: string | null) {
  const names = drug ? [drug.tradeName, drug.genericName, drug.drugClass].filter((x): x is string => !!x).map(lower) : manualName ? [lower(manualName)] : [];
  return db.patient_allergies.find((a) => {
    if (a.patientId !== patientId) return false;
    if (drug && a.drugId === drug.drugId) return true;
    const al = lower(a.allergenName);
    return names.some((n) => n.includes(al) || al.includes(n));
  });
}

type MedLike = Pick<PrescriptionMedication, 'drugId' | 'drugNameManual'>;

export function computeWarnings(patient: Patient, doctorId: string, meds: MedLike[], excludePrescriptionId?: string): PrescriptionWarningDto[] {
  const out: PrescriptionWarningDto[] = [];
  const active = activeMedications(patient, doctorId, excludePrescriptionId);
  const years = age(patientUser(patient).birthDate);
  meds.forEach((m, i) => {
    const drug = drugById(m.drugId);
    const name = medName(m);
    const allergy = allergyMatch(patient.patientId, drug, m.drugNameManual);
    if (allergy)
      out.push({
        type: 'ALLERGY', severity: allergy.severity, medicationIndex: i, requiresOverride: true,
        message: `Diqqət: pasientin "${allergy.allergenName}" allergiyası qeyd olunub (${ALLERGY_SEVERITY_LABEL[allergy.severity].toLowerCase()}) — ${name}${drug?.drugClass ? ` (${drug.drugClass} qrupu)` : ''}`,
      });
    if (!drug) {
      out.push({ type: 'MANUAL_DRUG', severity: 'MINOR', medicationIndex: i, requiresOverride: false, message: `"${name}" bazada yoxdur — qarşılıqlı təsir yoxlaması aparılmadı` });
      return;
    }
    if (drug.isControlled)
      out.push({ type: 'CONTROLLED', severity: 'MODERATE', medicationIndex: i, requiresOverride: false, message: `${name} nəzarətdə olan dərmandır — əsaslandırma tələb olunur` });
    // Reseptin öz daxilində (hər cüt bir dəfə) və aktiv dərmanlarla.
    meds.slice(i + 1).forEach((other, k) => {
      const ix = other.drugId ? interactionBetween(drug.drugId, other.drugId) : undefined;
      if (ix)
        out.push({
          type: 'INTERACTION', severity: ix.severity, medicationIndex: i + 1 + k, requiresOverride: ix.severity === 'SEVERE',
          message: `${name} + ${medName(other)} (${INTERACTION_SEVERITY_LABEL[ix.severity].toLowerCase()}): ${ix.description}`,
        });
    });
    for (const a of active) {
      const ix = a.drug ? interactionBetween(drug.drugId, a.drug.drugId) : undefined;
      if (ix)
        out.push({
          type: 'INTERACTION', severity: ix.severity, medicationIndex: i, requiresOverride: ix.severity === 'SEVERE',
          message: `${name} + aktiv dərman "${a.name}" (${INTERACTION_SEVERITY_LABEL[ix.severity].toLowerCase()}): ${ix.description}`,
        });
    }
    if (years < 12 || years >= 75)
      out.push({ type: 'AGE', severity: 'MINOR', medicationIndex: i, requiresOverride: false, message: `Pasient ${years} yaşındadır — ${name} dozasını yaşa uyğun yoxlayın` });
  });
  return out;
}

/** EF-601-5: imzalamaq üçün məcburi sahələr. */
function missingFields(p: Prescription, meds: PrescriptionMedication[]): Record<string, string> {
  const f: Record<string, string> = {};
  if (p.diagnosis.trim().length < 3) f.diagnosis = 'validation.required';
  if (meds.length === 0) f.medications = 'validation.required';
  meds.forEach((m, i) => {
    if (!m.drugId && !m.drugNameManual?.trim()) f[`medications.${i}.drug`] = 'validation.required';
    if (!m.dosage.trim()) f[`medications.${i}.dosage`] = 'validation.required';
    if (!m.frequency.trim()) f[`medications.${i}.frequency`] = 'validation.required';
  });
  return f;
}

// ── Serializer ──

function toMedicationDto(m: PrescriptionMedication): MedicationDto {
  const d = drugById(m.drugId);
  return {
    drugId: m.drugId, drugNameManual: m.drugNameManual, dosage: m.dosage, frequency: m.frequency, durationDays: m.durationDays, instructions: m.instructions,
    name: medName(m), form: d?.form ?? null, strength: d?.strength ?? null, isControlled: d?.isControlled ?? false,
    warningOverridden: m.warningOverridden, overrideReason: m.overrideReason,
  };
}

const payloadHash = (p: Prescription, meds: PrescriptionMedication[]) =>
  sha256(JSON.stringify([p.prescriptionId, p.patientId, p.diagnosis, p.icd10Code, p.generalNotes, p.validDays, meds.map((m) => [m.drugId, m.drugNameManual, m.dosage, m.frequency, m.durationDays, m.instructions])]));

function pendingRenewal(p: Prescription) {
  return db.prescription_renewal_requests.filter((r) => r.prescriptionId === p.prescriptionId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export function toPrescriptionDto(actor: Actor, p: Prescription): PrescriptionDto {
  const appt = db.appointments.find((a) => a.appointmentId === p.appointmentId)!;
  const dc = dcOfAppt(appt);
  const clinic = db.clinics.find((c) => c.clinicId === dc.clinicId)!;
  const doc = db.doctors.find((d) => d.doctorId === p.doctorId)!;
  const patient = db.patients.find((x) => x.patientId === p.patientId)!;
  const pu = patientUser(patient);
  const meds = medsOf(p.prescriptionId);
  const renewal = pendingRenewal(p);
  const actions: PrescriptionDto['allowedActions'] = [];
  if (actor.role === 'DOCTOR') {
    if (p.status === 'DRAFT') actions.push('EDIT', 'SIGN', 'CANCEL');
    if (p.status === 'SIGNED') actions.push('CANCEL');
    if (p.status === 'SIGNED' || p.status === 'EXPIRED') actions.push('COPY', 'DOWNLOAD_PDF');
  } else {
    if (p.status === 'SIGNED' || p.status === 'EXPIRED') actions.push('DOWNLOAD_PDF');
    if ((p.status === 'SIGNED' || p.status === 'EXPIRED') && renewal?.status !== 'PENDING') actions.push('REQUEST_RENEWAL');
  }
  return {
    prescriptionId: p.prescriptionId,
    prescriptionNumber: p.prescriptionNumber,
    status: p.status,
    appointmentId: p.appointmentId,
    appointmentDate: bakuDate(new Date(appt.startAt)),
    diagnosis: p.diagnosis,
    icd10Code: p.icd10Code,
    generalNotes: p.generalNotes,
    validDays: p.validDays,
    validUntil: p.validUntil,
    signedAt: p.signedAt,
    createdAt: p.createdAt,
    cancelledReason: p.cancelledReason,
    cancelledAt: p.cancelledAt,
    signatureValid: verifyPrescriptionSignature(p.doctorId, payloadHash(p, meds), p.digitalSignature),
    qrCodeToken: p.status === 'DRAFT' ? null : p.qrCodeToken,
    doctor: {
      doctorId: doc.doctorId, fullName: doctorFullName(doc), licenseNumber: doc.licenseNumber,
      specialties: db.doctor_specialties.filter((x) => x.doctorId === doc.doctorId).map((x) => db.specialties.find((s) => s.specialtyId === x.specialtyId)!.nameAz),
    },
    clinic: { clinicId: clinic.clinicId, name: clinic.name, address: clinic.address, phone: clinic.phone },
    patient: { patientId: patient.patientId, fullName: `${pu.firstName} ${pu.lastName}`, fin: pu.fin, birthDate: pu.birthDate, age: age(pu.birthDate), gender: pu.gender },
    medications: meds.map(toMedicationDto),
    renewal: renewal ? { requestId: renewal.requestId, status: renewal.status, reason: renewal.reason, createdAt: renewal.createdAt } : null,
    allowedActions: actions,
  };
}

function toCard(p: Prescription): PrescriptionCardDto {
  const appt = db.appointments.find((a) => a.appointmentId === p.appointmentId)!;
  const clinic = db.clinics.find((c) => c.clinicId === dcOfAppt(appt).clinicId)!;
  const pu = patientUser(db.patients.find((x) => x.patientId === p.patientId)!);
  return {
    prescriptionId: p.prescriptionId, prescriptionNumber: p.prescriptionNumber, status: p.status,
    date: bakuDate(new Date(p.signedAt ?? p.createdAt)), validUntil: p.validUntil,
    doctorName: doctorFullName(db.doctors.find((d) => d.doctorId === p.doctorId)!), clinicName: clinic.name,
    patientName: `${pu.firstName} ${pu.lastName}`, medicationCount: medsOf(p.prescriptionId).length, appointmentId: p.appointmentId,
  };
}

// ── UC-601: yaratma, redaktə, yoxlama, imza, ləğv ──

function writeMedications(prescriptionId: string, meds: MedicationInput[]) {
  db.prescription_medications = db.prescription_medications.filter((m) => m.prescriptionId !== prescriptionId);
  for (const m of meds) {
    if (m.drugId && !db.drugs.some((d) => d.drugId === m.drugId && d.isActive)) throw new ApiError('ValidationError', { fields: { drugId: 'validation.uuid' } });
    db.prescription_medications.push({
      prescriptionMedicationId: newId(), prescriptionId,
      drugId: m.drugId, drugNameManual: m.drugId ? null : (m.drugNameManual?.trim() || null),
      dosage: m.dosage, frequency: m.frequency, durationDays: m.durationDays, instructions: m.instructions?.trim() || null,
      warningOverridden: false, overrideReason: null, createdAt: clock.nowIso(),
    });
  }
}

const toInput = (m: Pick<PrescriptionMedication, 'drugId' | 'drugNameManual' | 'dosage' | 'frequency' | 'durationDays' | 'instructions'>): MedicationInput => ({
  drugId: m.drugId, drugNameManual: m.drugNameManual, dosage: m.dosage, frequency: m.frequency, durationDays: m.durationDays, instructions: m.instructions,
});

function newDraft(actor: Actor, doc: Doctor, appt: Appointment, meds: MedicationInput[], extra: Partial<Prescription> = {}): Prescription {
  const p: Prescription = {
    prescriptionId: newId(), prescriptionNumber: null, appointmentId: appt.appointmentId, patientId: appt.patientId, doctorId: doc.doctorId,
    diagnosis: '', icd10Code: null, generalNotes: null, status: 'DRAFT', digitalSignature: null, signedAt: null, qrCodeToken: null, validUntil: null,
    validDays: getSetting('prescription_validity_days'), controlledJustification: null, cancelledReason: null, cancelledAt: null, ...stamp(), ...extra,
  };
  db.prescriptions.push(p);
  writeMedications(p.prescriptionId, meds);
  audit(actor, { action: 'PRESCRIPTION_DRAFT_CREATED', entityType: 'prescription', entityId: p.prescriptionId, newValue: { appointmentId: appt.appointmentId, medications: meds.length } });
  return p;
}

/** Randevu üzrə qaralama açır. Eyni randevuda bu həkimin qaralaması varsa onu qaytarır (şablon/təkrar istisna). */
export function createPrescription(actor: Actor, input: { appointmentId: string; templateId?: string; copyFromPrescriptionId?: string }): PrescriptionDto {
  const doc = doctorOf(actor);
  assertCanPrescribe(doc);
  const appt = loadOwnAppointment(actor, doc, input.appointmentId);
  let meds: MedicationInput[] = [];
  let extra: Partial<Prescription> = {};
  if (input.templateId) {
    const t = db.prescription_templates.find((x) => x.templateId === input.templateId && x.doctorId === doc.doctorId);
    if (!t) denyAccess(actor, `prescription_template:${input.templateId}`);
    meds = t.medications.map(toInput);
  } else if (input.copyFromPrescriptionId) {
    // Alt 2: əvvəlki reseptin təkrarı — yalnız bu həkimin həmin pasientə yazdığı resept.
    const src = db.prescriptions.find((x) => x.prescriptionId === input.copyFromPrescriptionId);
    if (!src || src.doctorId !== doc.doctorId || src.patientId !== appt.patientId) denyAccess(actor, `prescription:${input.copyFromPrescriptionId}`);
    meds = medsOf(src.prescriptionId).map(toInput);
    extra = { diagnosis: src.diagnosis, icd10Code: src.icd10Code, generalNotes: src.generalNotes };
  } else {
    const existing = db.prescriptions.find((x) => x.appointmentId === appt.appointmentId && x.doctorId === doc.doctorId && x.status === 'DRAFT');
    if (existing) return toPrescriptionDto(actor, existing);
  }
  return toPrescriptionDto(actor, newDraft(actor, doc, appt, meds, extra));
}

export function prescriptionContext(actor: Actor, id: string): PrescriptionContextDto {
  const doc = doctorOf(actor);
  const p = loadPrescription(actor, id);
  const patient = db.patients.find((x) => x.patientId === p.patientId)!;
  const pu = patientUser(patient);
  audit(actor, { action: 'PATIENT_CONTEXT_VIEWED', entityType: 'prescription', entityId: id });
  return {
    patient: { patientId: patient.patientId, fullName: `${pu.firstName} ${pu.lastName}`, fin: pu.fin, birthDate: pu.birthDate, age: age(pu.birthDate), gender: pu.gender },
    allergies: db.patient_allergies.filter((a) => a.patientId === patient.patientId).map((a) => ({ allergenName: a.allergenName, severity: a.severity })),
    chronicConditions: db.patient_chronic_conditions.filter((c) => c.patientId === patient.patientId).map((c) => ({ conditionName: c.conditionName, icd10Code: c.icd10Code })),
    activeMedications: activeMedications(patient, doc.doctorId, id).map((m) => ({ name: m.name, source: m.source })),
    previousPrescriptions: db.prescriptions
      .filter((x) => x.patientId === patient.patientId && x.doctorId === doc.doctorId && x.prescriptionId !== id && x.signedAt)
      .sort((a, b) => b.signedAt!.localeCompare(a.signedAt!))
      .map((x) => ({ prescriptionId: x.prescriptionId, prescriptionNumber: x.prescriptionNumber, date: bakuDate(new Date(x.signedAt!)), diagnosis: x.diagnosis, medicationCount: medsOf(x.prescriptionId).length, status: refreshExpiry(x).status })),
    templates: listTemplates(actor),
    license: licenseState(doc),
    signatureCertificate: certState(doc),
    defaultValidDays: getSetting('prescription_validity_days'),
  };
}

export function updateDraft(
  actor: Actor,
  id: string,
  patch: { diagnosis?: string; icd10Code?: string | null; generalNotes?: string | null; validDays?: number; medications?: MedicationInput[] },
): PrescriptionDto {
  const p = loadOwnDraft(actor, id);
  const { medications, ...fields } = patch;
  update(p, { ...fields, ...(fields.generalNotes !== undefined ? { generalNotes: fields.generalNotes || null } : {}) });
  if (medications) writeMedications(p.prescriptionId, medications);
  audit(actor, { action: 'PRESCRIPTION_DRAFT_UPDATED', entityType: 'prescription', entityId: id, newValue: { fields: Object.keys(patch) } });
  return toPrescriptionDto(actor, p);
}

export function checkPrescription(actor: Actor, id: string): PrescriptionCheckDto {
  const p = loadOwnDraft(actor, id);
  const meds = medsOf(id);
  return { warnings: computeWarnings(db.patients.find((x) => x.patientId === p.patientId)!, p.doctorId, meds, id), missingFields: missingFields(p, meds) };
}

/** Ardıcıl unikal nömrə: RX-İİİİ-NNNNNN (BR-601-07). */
function nextNumber(): string {
  const year = bakuDate().slice(0, 4);
  let seq = db.prescriptions.filter((x) => x.prescriptionNumber?.startsWith(`RX-${year}-`)).length + 1;
  let n = '';
  do n = `RX-${year}-${String(seq++).padStart(6, '0')}`;
  while (db.prescriptions.some((x) => x.prescriptionNumber === n));
  return n;
}

export function signPrescription(
  actor: Actor,
  id: string,
  input: { confirmationPin: string; overrides: { medicationIndex: number; reason: string }[]; controlledJustification?: string },
): PrescriptionDto {
  const p = loadOwnDraft(actor, id);
  const doc = doctorOf(actor);
  assertCanPrescribe(doc);
  if (!certState(doc).valid) throw new ApiError('SignatureCertificateInvalid'); // EF-601-2
  loadOwnAppointment(actor, doc, p.appointmentId);
  const meds = medsOf(id);
  const missing = missingFields(p, meds);
  if (Object.keys(missing).length) throw new ApiError('ValidationError', { fields: missing }); // EF-601-5

  const user = db.users.find((u) => u.userId === actor.userId)!;
  if (!verifySecret(input.confirmationPin, user.pinHash)) {
    audit(actor, { action: 'PRESCRIPTION_SIGN_PIN_FAILED', entityType: 'prescription', entityId: id });
    throw new ApiError('InvalidPin');
  }

  // EF-601-3/4: səbəbsiz ötürmə yoxdur (BR-601-09).
  const warnings = computeWarnings(db.patients.find((x) => x.patientId === p.patientId)!, p.doctorId, meds, id);
  const reasonFor = (i: number) => input.overrides.find((o) => o.medicationIndex === i)?.reason;
  const unresolved = warnings.filter((w) => w.requiresOverride && !reasonFor(w.medicationIndex));
  if (unresolved.length) throw new ApiError(unresolved.some((w) => w.type === 'ALLERGY') ? 'AllergyConflict' : 'DrugInteraction', { warnings: unresolved });
  const controlled = warnings.some((w) => w.type === 'CONTROLLED');
  if (controlled && !input.controlledJustification) throw new ApiError('ControlledDrugJustificationRequired'); // EF-601-8

  // Rəqəmsal imza servisi (EF-601-6: xəta → DRAFT qalır, pasientə heç nə getmir).
  let signature: string;
  try {
    signature = signWithService(doc.doctorId, payloadHash(p, meds));
  } catch (e) {
    if (!(e instanceof SignatureServiceError)) throw e;
    audit(actor, { action: 'PRESCRIPTION_SIGN_FAILED', entityType: 'prescription', entityId: id, newValue: { error: e.message } });
    throw new ApiError('ServiceUnavailable', { savedAsDraft: true }, 'İmza servisi hazırda cavab vermir. Resept qaralama kimi saxlanıldı — bir az sonra yenidən cəhd edin');
  }

  for (const w of warnings.filter((x) => x.requiresOverride)) {
    const m = meds[w.medicationIndex];
    m.warningOverridden = true;
    m.overrideReason = reasonFor(w.medicationIndex)!;
    audit(actor, { action: 'PRESCRIPTION_WARNING_OVERRIDDEN', entityType: 'prescription', entityId: id, newValue: { type: w.type, severity: w.severity, medication: medName(m) }, reason: m.overrideReason });
  }
  const now = clock.nowIso();
  update(p, {
    status: 'SIGNED', digitalSignature: signature, signedAt: now, prescriptionNumber: nextNumber(), qrCodeToken: randomToken(18),
    validUntil: addDaysToDate(bakuDate(), p.validDays), controlledJustification: controlled ? input.controlledJustification! : null,
  });
  audit(actor, { action: 'PRESCRIPTION_SIGNED', entityType: 'prescription', entityId: id, newValue: { prescriptionNumber: p.prescriptionNumber, validUntil: p.validUntil, medications: meds.length }, reason: p.controlledJustification });
  notify({
    type: 'PRESCRIPTION_CREATED', userId: patientUser(db.patients.find((x) => x.patientId === p.patientId)!).userId,
    vars: { doctorName: doctorFullName(doc) }, deepLink: `/account/prescriptions/${id}`, entity: { type: 'prescription', id },
  });
  return toPrescriptionDto(actor, p);
}

export function cancelPrescription(actor: Actor, id: string, reason: string): PrescriptionDto {
  if (actor.role !== 'DOCTOR') throw new ApiError('Forbidden');
  const p = loadPrescription(actor, id);
  if (p.status !== 'DRAFT' && p.status !== 'SIGNED') throw new ApiError('InvalidStatusTransition');
  const wasSigned = p.status === 'SIGNED';
  update(p, { status: 'CANCELLED', cancelledReason: reason, cancelledAt: clock.nowIso() }); // BR-601-06: silinmir
  audit(actor, { action: 'PRESCRIPTION_CANCELLED', entityType: 'prescription', entityId: id, oldValue: { status: wasSigned ? 'SIGNED' : 'DRAFT' }, reason });
  if (wasSigned)
    notify({
      type: 'PRESCRIPTION_CANCELLED', userId: patientUser(db.patients.find((x) => x.patientId === p.patientId)!).userId,
      vars: { doctorName: doctorFullName(doctorOf(actor)), prescriptionNumber: p.prescriptionNumber ?? '', reason }, deepLink: `/account/prescriptions/${id}`, entity: { type: 'prescription', id },
    });
  return toPrescriptionDto(actor, p);
}

// ── UC-602: siyahı, detal, PDF, doğrulama ──

function tabOf(p: Prescription): PrescriptionTab {
  if (p.status === 'DRAFT') return 'DRAFT';
  if (p.status === 'CANCELLED') return 'CANCELLED';
  if (p.status === 'SIGNED') return 'ACTIVE';
  return 'PAST';
}

export function listPrescriptions(actor: Actor, q: { tab: PrescriptionTab; patientId?: string }): PrescriptionListDto {
  let mine: Prescription[];
  if (actor.role === 'PATIENT') {
    const patient = patientOf(actor);
    mine = db.prescriptions.filter((p) => p.patientId === patient.patientId && p.signedAt); // draft və imzasız ləğv görünmür
  } else {
    const doc = doctorOf(actor);
    mine = db.prescriptions.filter((p) => p.doctorId === doc.doctorId && (!q.patientId || p.patientId === q.patientId));
  }
  mine.forEach(refreshExpiry);
  const counts: Record<PrescriptionTab, number> = { ACTIVE: 0, PAST: 0, CANCELLED: 0, DRAFT: 0 };
  for (const p of mine) counts[tabOf(p)]++;
  const list = mine.filter((p) => tabOf(p) === q.tab).sort((a, b) => (b.signedAt ?? b.updatedAt).localeCompare(a.signedAt ?? a.updatedAt));
  return { tab: q.tab, counts, prescriptions: list.map(toCard) };
}

export function getPrescription(actor: Actor, id: string): PrescriptionDto {
  const p = loadPrescription(actor, id);
  audit(actor, { action: 'PRESCRIPTION_VIEWED', entityType: 'prescription', entityId: id }); // BR-600-03
  return toPrescriptionDto(actor, p);
}

export function prescriptionPdf(actor: Actor, id: string): { fileName: string; body: Buffer } {
  const p = loadPrescription(actor, id);
  if (!p.signedAt) throw new ApiError('PrescriptionNotSigned');
  const dto = toPrescriptionDto(actor, p);
  audit(actor, { action: 'PRESCRIPTION_PDF_DOWNLOADED', entityType: 'prescription', entityId: id });
  const lines = [
    `Status: ${dto.status}${dto.status === 'CANCELLED' ? ` - ETIBARSIZ (${dto.cancelledReason ?? ''})` : ''}`,
    `Pasient: ${dto.patient.fullName}, FIN ${dto.patient.fin}, ${dto.patient.age} yas`,
    `Hekim: ${dto.doctor.fullName} (lisenziya ${dto.doctor.licenseNumber}), ${dto.clinic.name}`,
    `Tarix: ${bakuDate(new Date(dto.signedAt!))}  Etibarlidir: ${dto.validUntil}`,
    `Diaqnoz: ${dto.diagnosis}${dto.icd10Code ? ` (ICD-10 ${dto.icd10Code})` : ''}`,
    '',
    ...dto.medications.map((m, i) => `${i + 1}. ${m.name} - ${m.dosage}, ${m.frequency}${m.durationDays ? `, ${m.durationDays} gun` : ''}${m.instructions ? ` (${m.instructions})` : ''}`),
    '',
    ...(dto.generalNotes ? [`Tovsiyeler: ${dto.generalNotes}`] : []),
    `Reqemsal imza: ${dto.signatureValid ? 'dogrulandi' : 'ETIBARSIZ'}  Dogrulama kodu: ${dto.qrCodeToken}`,
  ];
  return { fileName: `${dto.prescriptionNumber}.pdf`, body: makePdf(`E-resept ${dto.prescriptionNumber}`, lines) };
}

/** Aptek doğrulaması (QR) — açıq endpoint, tibbi detal qaytarmır (BR-602-06). */
export function verifyPrescription(actor: Actor, qrToken: string): PrescriptionVerifyDto {
  const p = db.prescriptions.find((x) => x.qrCodeToken === qrToken && x.signedAt);
  if (!p) throw new ApiError('NotFound');
  refreshExpiry(p);
  const pu = patientUser(db.patients.find((x) => x.patientId === p.patientId)!);
  const card = toCard(p);
  audit(actor, { action: 'PRESCRIPTION_VERIFIED', entityType: 'prescription', entityId: p.prescriptionId });
  return {
    prescriptionNumber: p.prescriptionNumber!, status: p.status,
    valid: p.status === 'SIGNED' && verifyPrescriptionSignature(p.doctorId, payloadHash(p, medsOf(p.prescriptionId)), p.digitalSignature),
    signedAt: p.signedAt!, validUntil: p.validUntil!, doctorName: card.doctorName, clinicName: card.clinicName,
    patientInitials: `${pu.firstName[0]}. ${pu.lastName[0]}.`, medicationCount: card.medicationCount,
  };
}

// ── Şablonlar (alt 1) ──

export function listTemplates(actor: Actor): TemplateDto[] {
  const doc = doctorOf(actor);
  return db.prescription_templates
    .filter((t) => t.doctorId === doc.doctorId)
    .sort((a, b) => a.name.localeCompare(b.name, 'az'))
    .map((t) => ({ templateId: t.templateId, name: t.name, createdAt: t.createdAt, medications: t.medications.map((m) => ({ ...toInput(m), name: medName(m) })) }));
}

export function createTemplate(actor: Actor, input: { name: string; medications: MedicationInput[] }): TemplateDto[] {
  const doc = doctorOf(actor);
  for (const m of input.medications) if (m.drugId && !db.drugs.some((d) => d.drugId === m.drugId)) throw new ApiError('ValidationError', { fields: { drugId: 'validation.uuid' } });
  const templateId = newId();
  db.prescription_templates.push({ templateId, doctorId: doc.doctorId, name: input.name, medications: input.medications.map(toInput), createdAt: clock.nowIso() });
  audit(actor, { action: 'PRESCRIPTION_TEMPLATE_CREATED', entityType: 'prescription_template', entityId: templateId, newValue: { name: input.name } });
  return listTemplates(actor);
}

export function deleteTemplate(actor: Actor, templateId: string): TemplateDto[] {
  const doc = doctorOf(actor);
  const t = db.prescription_templates.find((x) => x.templateId === templateId && x.doctorId === doc.doctorId);
  if (!t) denyAccess(actor, `prescription_template:${templateId}`);
  db.prescription_templates = db.prescription_templates.filter((x) => x !== t);
  audit(actor, { action: 'PRESCRIPTION_TEMPLATE_DELETED', entityType: 'prescription_template', entityId: templateId });
  return listTemplates(actor);
}

// ── Təkrar resept sorğusu (UC-602 alt 2, BR-602-07) ──

function toRenewalDto(r: (typeof db.prescription_renewal_requests)[number]): RenewalRequestDto {
  const p = db.prescriptions.find((x) => x.prescriptionId === r.prescriptionId)!;
  const pu = patientUser(db.patients.find((x) => x.patientId === r.patientId)!);
  const np = r.newPrescriptionId ? db.prescriptions.find((x) => x.prescriptionId === r.newPrescriptionId) : null;
  return {
    requestId: r.requestId, prescriptionId: r.prescriptionId, prescriptionNumber: p.prescriptionNumber, patientId: r.patientId,
    patientName: `${pu.firstName} ${pu.lastName}`, note: r.note, status: r.status, reason: r.reason, newPrescriptionId: r.newPrescriptionId,
    newAppointmentId: np?.appointmentId ?? null, createdAt: r.createdAt, medications: medsOf(p.prescriptionId).map(medName),
  };
}

export function requestRenewal(actor: Actor, id: string, note: string | undefined): PrescriptionDto {
  if (actor.role !== 'PATIENT') throw new ApiError('Forbidden');
  const p = loadPrescription(actor, id);
  if (p.status !== 'SIGNED' && p.status !== 'EXPIRED') throw new ApiError('InvalidStatusTransition');
  if (pendingRenewal(p)?.status === 'PENDING') throw new ApiError('Conflict', undefined, 'Bu resept üçün sorğu artıq göndərilib, həkimin cavabını gözləyin');
  const r = { requestId: newId(), prescriptionId: id, patientId: p.patientId, doctorId: p.doctorId, status: 'PENDING' as const, note: note?.trim() || null, reason: null, newPrescriptionId: null, createdAt: clock.nowIso(), resolvedAt: null };
  db.prescription_renewal_requests.push(r);
  audit(actor, { action: 'PRESCRIPTION_RENEWAL_REQUESTED', entityType: 'prescription', entityId: id });
  const doc = db.doctors.find((d) => d.doctorId === p.doctorId)!;
  const pu = patientUser(patientOf(actor));
  notify({
    type: 'PRESCRIPTION_RENEWAL_REQUESTED', userId: doc.userId, vars: { patientName: `${pu.firstName} ${pu.lastName}`, prescriptionNumber: p.prescriptionNumber ?? '' },
    deepLink: '/doctor/prescriptions?tab=RENEWALS', entity: { type: 'prescription_renewal_request', id: r.requestId },
  });
  return toPrescriptionDto(actor, p);
}

export function listRenewalRequests(actor: Actor, status?: 'PENDING' | 'APPROVED' | 'REJECTED'): RenewalRequestDto[] {
  const doc = doctorOf(actor);
  return db.prescription_renewal_requests
    .filter((r) => r.doctorId === doc.doctorId && (!status || r.status === status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toRenewalDto);
}

/** Təsdiq → köhnə reseptin dərmanları ilə yeni qaralama (həkim yoxlayıb imzalayır). Rədd → pasientə səbəb. */
export function resolveRenewal(actor: Actor, requestId: string, input: { decision: 'APPROVE' | 'REJECT'; reason?: string }): RenewalRequestDto {
  const doc = doctorOf(actor);
  const r = db.prescription_renewal_requests.find((x) => x.requestId === requestId);
  if (!r || r.doctorId !== doc.doctorId) return denyAccess(actor, `prescription_renewal_request:${requestId}`);
  if (r.status !== 'PENDING') throw new ApiError('InvalidStatusTransition');
  const src = db.prescriptions.find((x) => x.prescriptionId === r.prescriptionId)!;
  if (input.decision === 'APPROVE') {
    assertCanPrescribe(doc);
    const appt = db.appointments.find((a) => a.appointmentId === src.appointmentId)!;
    const draft = newDraft(actor, doc, appt, medsOf(src.prescriptionId).map(toInput), { diagnosis: src.diagnosis, icd10Code: src.icd10Code, generalNotes: src.generalNotes });
    Object.assign(r, { status: 'APPROVED', newPrescriptionId: draft.prescriptionId, resolvedAt: clock.nowIso() });
  } else {
    Object.assign(r, { status: 'REJECTED', reason: input.reason!, resolvedAt: clock.nowIso() });
    notify({
      type: 'PRESCRIPTION_RENEWAL_REJECTED', userId: patientUser(db.patients.find((x) => x.patientId === r.patientId)!).userId,
      vars: { doctorName: doctorFullName(doc), reason: input.reason! }, deepLink: `/account/prescriptions/${src.prescriptionId}`, entity: { type: 'prescription', id: src.prescriptionId },
    });
  }
  audit(actor, { action: `PRESCRIPTION_RENEWAL_${r.status}`, entityType: 'prescription_renewal_request', entityId: requestId, reason: r.reason });
  return toRenewalDto(r);
}

// ── Job ──

/** BR-602-04: etibarlılıq tarixi keçmiş SIGNED → EXPIRED. */
export function expirePrescriptions(): number {
  let n = 0;
  for (const p of db.prescriptions) if (p.status === 'SIGNED' && refreshExpiry(p).status === 'EXPIRED') n++;
  return n;
}
