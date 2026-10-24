import type { Actor } from '../core/actor';
import { addDaysToDate, addMinutes, bakuDate, bakuTime, clock, minutesToTime, timeToMinutes } from '../core/clock';
import { createAppointment, lockSlot } from '../services/appointments.service';
import { cancelPrescription, createPrescription, createTemplate, expirePrescriptions, signPrescription, updateDraft } from '../services/prescriptions.service';
import { slotStart, tooSoon } from '../services/slots.service';
import { inviteDoctor } from '../services/clinic-doctors.service';
import { makePdf } from './seed-data/files';
import type { MedicationInput } from '@mediconnect/shared';
import { db } from './db';
import { newId } from './repo';
import { DEMO_PIN } from './seed';

// Demo vəziyyətləri (mock-backend.md → "Vəziyyətlər"): real servis axını ilə yaradılır (lock → create), ona görə
// audit, xatırlatmalar və status tarixçəsi də realdır. Seed zamanı göndərilən bildirişlər sonda təmizlənir.

const actorFor = (fin: string): Actor => {
  const u = db.users.find((x) => x.fin === fin)!;
  return { userId: u.userId, role: u.role, ip: 'seed', userAgent: 'seed' };
};

const doctorId = (fin: string) => db.doctors.find((d) => d.userId === db.users.find((u) => u.fin === fin)!.userId)!.doctorId;
const clinicId = (name: string) => db.clinics.find((c) => c.name === name)!.clinicId;
const serviceId = (name: string) => db.services.find((s) => s.nameAz === name)!.serviceId;
const dcOf = (doctorFin: string, clinicName: string) => db.doctor_clinics.find((x) => x.doctorId === doctorId(doctorFin) && x.clinicId === clinicId(clinicName))!;

/** Sabahdan başlayaraq ilk uyğun boş slot (səhər saatları üstün tutulur). */
function firstSlot(doctorFin: string, clinicName: string, minDate: string) {
  const dc = dcOf(doctorFin, clinicName);
  return db.appointment_slots
    .filter((s) => s.doctorClinicId === dc.doctorClinicId && s.status === 'AVAILABLE' && s.slotDate >= minDate && !tooSoon(s))
    .sort((a, b) => (a.slotDate + a.startTime).localeCompare(b.slotDate + b.startTime))[0];
}

function book(patientFin: string, doctorFin: string, clinicName: string, service: string, minDate: string, note: string | null, documentIds: string[] = []) {
  const actor = actorFor(patientFin);
  const slot = firstSlot(doctorFin, clinicName, minDate);
  if (!slot) return null;
  lockSlot(actor, slot.slotId, serviceId(service));
  return createAppointment(actor, { doctorId: doctorId(doctorFin), clinicId: clinicId(clinicName), serviceId: serviceId(service), slotId: slot.slotId, patientNote: note, documentIds });
}

export function seedScenarios() {
  const tomorrow = bakuDate(addMinutes(clock.now(), 24 * 60));
  const NIGAR = '6NS35AA';
  const AYGUN = '3KL88MN';

  // 1) Sabah (və ya ən yaxın) Dr. Aygün ilə təsdiqlənmiş randevu (AUTO rejim).
  // EKQ nəticəsi randevuya əlavə olunur → həkimə avtomatik icazə (FR-401-24).
  const ecg = db.medical_documents.find((x) => x.fileName === 'EKQ nəticəsi.png');
  book(NIGAR, AYGUN, 'Mərkəzi Klinika', 'Təkrar müayinə', tomorrow, 'Təzyiq səhərlər 150/95 olur, dərman dozasını müzakirə etmək istəyirəm.', ecg ? [ecg.documentId] : []);
  // 2) Dr. Rəşad (MANUAL) — həkimin təsdiqini gözləyən randevu.
  book(NIGAR, '7RH21KL', 'Kaspi Tibb Mərkəzi', 'İlkin müayinə', tomorrow, 'Son iki həftədə tez-tez baş ağrısı.');
  // 3) Başqa pasient — Dr. Aygünün sabahkı siyahısı dolu görünsün.
  book('1PA03AA', AYGUN, 'Mərkəzi Klinika', 'İlkin müayinə', tomorrow, null);

  // 4) 25 dəqiqə sonra başlayan qəbul (həkim panelində "tamamla / gəlmədi" demosu). Cədvəldən kənar xüsusi slot.
  // Həkimin 15–45 dəqiqə sonra başlayan real boş slotu varsa o istifadə olunur, yoxdursa cədvəldən kənar xüsusi slot yaradılır.
  const aygunDcs = db.doctor_clinics.filter((x) => x.doctorId === doctorId(AYGUN) && x.status === 'ACTIVE').map((x) => x.doctorClinicId);
  const near = db.appointment_slots.find((s) => aygunDcs.includes(s.doctorClinicId) && s.status === 'AVAILABLE' && slotStart(s).getTime() >= addMinutes(clock.now(), 15).getTime() && slotStart(s).getTime() <= addMinutes(clock.now(), 45).getTime());
  const dc = near ? db.doctor_clinics.find((x) => x.doctorClinicId === near.doctorClinicId)! : dcOf(AYGUN, 'Mərkəzi Klinika');
  const start = addMinutes(clock.now(), 25);
  const startTime = near?.startTime ?? minutesToTime(Math.floor(timeToMinutes(bakuTime(start)) / 5) * 5);
  const date = near?.slotDate ?? bakuDate(start);
  {
    const ts = clock.nowIso();
    const slot = near ?? { slotId: newId(), doctorClinicId: dc.doctorClinicId, slotDate: date, startTime, endTime: minutesToTime(timeToMinutes(startTime) + 30), status: 'BOOKED' as const, lockedBy: null, lockedUntil: null, blockedReason: null, createdAt: ts, updatedAt: ts };
    if (near) near.status = 'BOOKED';
    else db.appointment_slots.push(slot);
    const patient = db.patients.find((p) => p.userId === actorFor('1PA01AA').userId)!;
    const at = slotStart(slot);
    const appointmentId = newId();
    db.appointments.push({
      appointmentId, bookingReference: `MC-${date.slice(0, 4)}-${date.slice(5, 7)}${date.slice(8, 10)}-7001`, patientId: patient.patientId,
      doctorClinicId: dc.doctorClinicId, slotId: slot.slotId, slotIds: [slot.slotId], serviceId: serviceId('İlkin müayinə'), status: 'CONFIRMED',
      startAt: at.toISOString(), endAt: addMinutes(at, 30).toISOString(), patientNote: 'Ürək döyüntüsü, xüsusilə axşamlar.', doctorNote: null,
      rescheduleCount: 0, cancelledBy: null, cancellationReason: null, cancelledAt: null, completedAt: null, pendingReschedule: null, reviewInvited: false,
      createdAt: addMinutes(clock.now(), -3 * 24 * 60).toISOString(), updatedAt: ts,
    });
    db.appointment_status_history.push({ historyId: newId(), appointmentId, oldStatus: null, newStatus: 'CONFIRMED', changedBy: null, changeReason: null, oldSlotId: null, changedAt: ts });
  }

  seedPrescriptions(NIGAR, AYGUN);

  // Seed zamanı yaranan bildirişlər və mesajlar təmizlənir (dev panel "Mesajlar" boş başlasın).
  db.notifications = [];
  db.notification_deliveries = [];
  db.dev_outbox = [];

  // UC-802 demosu: Mərkəzi Klinika Samirə Rzayevanı dəvət edib (SMS dev panel → Mesajlar-da görünür, link 7 gün etibarlıdır).
  seedPendingInvite();
}

const drug = (tradeName: string) => db.drugs.find((d) => d.tradeName === tradeName)!.drugId;
const med = (tradeName: string, dosage: string, frequency: string, durationDays: number | null, instructions: string | null): MedicationInput => ({
  drugId: drug(tradeName), drugNameManual: null, dosage, frequency, durationDays, instructions,
});

/** Reseptlər real servis axını ilə (qaralama → imza) yaradılır, sonra tarixləri randevu gününə çəkilir (imza məzmun hash-inə bağlıdır, tarixə yox). */
function seedPrescriptions(nigarFin: string, aygunFin: string) {
  const nigar = db.patients.find((p) => p.userId === actorFor(nigarFin).userId)!;
  const pastWith = (doctorFin: string) =>
    db.appointments.find((a) => a.patientId === nigar.patientId && a.status === 'COMPLETED' && db.doctor_clinics.find((x) => x.doctorClinicId === a.doctorClinicId)!.doctorId === doctorId(doctorFin));
  const write = (doctorFin: string, appointmentId: string, data: { diagnosis: string; icd10Code: string; generalNotes: string | null; validDays: number; medications: MedicationInput[] }) => {
    const actor = actorFor(doctorFin);
    const draft = createPrescription(actor, { appointmentId });
    updateDraft(actor, draft.prescriptionId, data);
    const signed = signPrescription(actor, draft.prescriptionId, { confirmationPin: DEMO_PIN, overrides: [] });
    const appt = db.appointments.find((a) => a.appointmentId === appointmentId)!;
    const p = db.prescriptions.find((x) => x.prescriptionId === signed.prescriptionId)!;
    const signedAt = appt.completedAt ?? appt.endAt;
    Object.assign(p, { signedAt, createdAt: appt.endAt, updatedAt: signedAt, validUntil: addDaysToDate(bakuDate(new Date(signedAt)), p.validDays) });
    return p;
  };

  const aygunVisit = pastWith(aygunFin);
  if (aygunVisit) {
    // Aktiv resept (Nigar → Reseptlərim → Aktiv). Atoris sonradan Klasid yazılanda qarşılıqlı təsir verir.
    write(aygunFin, aygunVisit.appointmentId, {
      diagnosis: 'Arterial hipertenziya, I dərəcə; hiperxolesterinemiya', icd10Code: 'I10', validDays: 60,
      generalNotes: 'Duz qəbulunu azaldın, gündəlik 30 dəqiqə piyada gəzinti. Təzyiqi səhər və axşam ölçüb qeyd edin.',
      medications: [med('Norvask', '1 tablet', 'gündə 1 dəfə, səhər', 60, null), med('Atoris', '1 tablet', 'gündə 1 dəfə, axşam', 60, 'yeməkdən sonra')],
    });
    // Ləğv edilmiş resept (BR-601-05/06: səhv resept ləğv olunur, silinmir).
    const wrong = write(aygunFin, aygunVisit.appointmentId, {
      diagnosis: 'Arterial hipertenziya, I dərəcə', icd10Code: 'I10', validDays: 30, generalNotes: null,
      medications: [med('Konkor', '2 tablet', 'gündə 2 dəfə', 30, null)],
    });
    cancelPrescription(actorFor(aygunFin), wrong.prescriptionId, 'Doza səhv yazılıb, düzgün resept ayrıca verildi');
    createTemplate(actorFor(aygunFin), {
      name: 'Hipertenziya — başlanğıc müalicə',
      medications: [med('Lizinopril', '1 tablet', 'gündə 1 dəfə, səhər', 30, null), med('Norvask', '1 tablet', 'gündə 1 dəfə', 30, null)],
    });
  }
  // Müddəti bitmiş resept (Dr. Leyla, 5 gün etibarlı) — siyahı açılanda avtomatik EXPIRED olur.
  const leylaVisit = pastWith('8LE33AB');
  if (leylaVisit)
    write('8LE33AB', leylaVisit.appointmentId, {
      diagnosis: 'Kəskin bronxit', icd10Code: 'J20.9', validDays: 5, generalNotes: 'Bol isti maye qəbul edin.',
      medications: [med('Sumamed', '1 tablet', 'gündə 1 dəfə', 3, 'yeməkdən 1 saat əvvəl'), med('Lazolvan', '1 tablet', 'gündə 3 dəfə', 5, 'yeməkdən sonra')],
    });
  expirePrescriptions();
}

function seedPendingInvite() {
  const clinic = db.clinics.find((c) => c.name === 'Mərkəzi Klinika')!;
  const adminLink = db.clinic_admins.find((a) => a.clinicId === clinic.clinicId && a.status === 'ACTIVE')!;
  const actor: Actor = { userId: adminLink.userId, role: 'CLINIC_ADMIN', ip: 'seed', userAgent: 'seed' };
  const pdf = makePdf('Tibbi lisenziya', ['Samire Rzayeva', 'Pediatriya', 'Lisenziya: AZ-PED-77120']).toString('base64');
  inviteDoctor(
    actor,
    {
      fin: '8HD3KL1', mobileNumber: '+994500000030', firstName: 'Samirə', lastName: 'Rzayeva', licenseNumber: 'AZ-PED-77120',
      licenseExpiryDate: addDaysToDate(bakuDate(), 730), specialtyIds: [db.specialties.find((x) => x.nameAz === 'Pediatr')!.specialtyId], roomNumber: '214',
      services: [{ serviceId: serviceId('İlkin müayinə'), durationMinutes: 30 }, { serviceId: serviceId('Təkrar müayinə'), durationMinutes: 20 }],
      documents: [{ kind: 'LICENSE', fileName: 'lisenziya.pdf', dataUrl: `data:application/pdf;base64,${pdf}` }],
    },
    process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  );
}
