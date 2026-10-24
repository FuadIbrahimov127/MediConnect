import { LANGUAGE, NOTIFICATION_TYPE, SETTINGS, type Gender, type UserRole } from '@mediconnect/shared';
import { addDays, addDaysToDate, addMinutes, bakuDate, bakuDayOfWeek, bakuToUtc, clock, minutesToTime, timeToMinutes } from '../core/clock';
import { hashSecret } from '../core/crypto';
import { NOTIFICATION_CONFIG } from '../services/notifications.config';
import { recalculateAll } from '../services/ratings.service';
import { rollSlotGeneration } from '../services/schedule.service';
import { emptyDb, replaceDb, saveNow, type DbSchema } from './db';
import { newId } from './repo';
import { CLINICS, DOCTORS, REVIEW_COMMENTS, REVIEWER_PATIENTS, type CityKey } from './seed-data/directory';
import { TEMPLATES } from './seed-data/templates';
import { DRUGS, INTERACTIONS } from './seed-data/drugs';
import { DEFAULT_BANNED } from '../services/moderation.service';
import { makeEcgPng, makePdf } from './seed-data/files';
import { putEncrypted, resetStorage } from '../integrations/storage';
import { seedScenarios } from './seed-scenarios';
import type { Clinic, DoctorClinic, Patient, User } from './types';

// Deterministik demo data (mock-backend.md → "Seed data"). Vaxta bağlı vəziyyətlər clock.now()-a nisbətən qurulur.
// Bütün demo istifadəçilərin PIN-i DEMO_PIN-dir.

export const DEMO_PIN = '2580';

/** Dev panel "Rollar" siyahısı üçün təsvirlər (FIN → mətn; restartdan sonra da işləsin deyə FIN üzrə). */
export const DEMO_DESCRIPTIONS: Record<string, string> = {
  '1AA1AA1': 'Platforma administratoru',
  '2BB2BB2': 'Mərkəzi Klinika administratoru',
  '3CC3CC3': 'Kaspi Tibb Mərkəzi administratoru',
  '3KL88MN': 'Kardioloq — 2 klinikada işləyir (avtomatik təsdiq)',
  '7RH21KL': 'Nevroloq — manual təsdiq rejimi',
  '9XY44ZW': 'Ortoped — lisenziyası 13 gün sonra bitir',
  '7FM22OP': 'Yeni həkim — profili tamamlanmayıb (ilk giriş demosu)',
  '6NS35AA': 'Əsas demo pasient (allergiya, sənədlər, randevular)',
  '4OS77BB': 'No-show limiti aşılıb (randevu bloku demosu)',
  '9SE12CC': 'Yeni pasient (boş kabinet)',
};

export { GOV_REGISTRY, type GovPerson } from './seed-data/registry';

/** Deterministik təsadüfi ədədlər (mulberry32) — seed hər dəfə eyni nəticə versin. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Orta göstəricisi `target`-ə yaxın olan N reytinq (2–5). */
function ratingsFor(target: number, n: number, rand: () => number): number[] {
  const out = Array.from({ length: n }, () => 5);
  let deficit = Math.round(5 * n - target * n);
  while (deficit > 0) {
    const i = Math.floor(rand() * n);
    if (out[i] > 2) {
      out[i]--;
      deficit--;
    }
  }
  return out;
}

export function buildSeed(): DbSchema {
  const d = emptyDb();
  const now = clock.now();
  const ts = now.toISOString();
  const stamp = { createdAt: ts, updatedAt: ts };
  const pinHash = hashSecret(DEMO_PIN);
  const today = bakuDate(now);
  const rand = rng(20261023);

  // ── system_settings ──
  for (const [key, def] of Object.entries(SETTINGS)) {
    d.system_settings.push({
      settingId: newId(), settingKey: key, settingValue: String(def.value), dataType: 'INTEGER', category: def.category,
      description: def.description, isCritical: 'isCritical' in def ? Boolean(def.isCritical) : false, updatedBy: null, updatedAt: ts,
    });
  }

  // ── notification_templates ──
  for (const type of NOTIFICATION_TYPE) {
    for (const lang of LANGUAGE) {
      for (const channel of NOTIFICATION_CONFIG[type].channels.concat(NOTIFICATION_CONFIG[type].channels.includes('IN_APP') ? [] : ['IN_APP'])) {
        const t = TEMPLATES[type][lang];
        d.notification_templates.push({
          templateId: newId(), notificationType: type, languageCode: lang, channel,
          titleTemplate: channel === 'SMS' ? null : t.title, bodyTemplate: t.body, isActive: true, updatedAt: ts,
        });
      }
    }
  }

  // ── kataloqlar ──
  const city = (az: string, ru: string, en: string) => {
    const c = { cityId: newId(), nameAz: az, nameRu: ru, nameEn: en, isActive: true };
    d.cities.push(c);
    return c.cityId;
  };
  const cities: Record<CityKey | 'mingachevir' | 'lankaran' | 'shaki', string> = {
    baku: city('Bakı', 'Баку', 'Baku'),
    ganja: city('Gəncə', 'Гянджа', 'Ganja'),
    sumgait: city('Sumqayıt', 'Сумгаит', 'Sumgait'),
    mingachevir: city('Mingəçevir', 'Мингечевир', 'Mingachevir'),
    lankaran: city('Lənkəran', 'Ленкорань', 'Lankaran'),
    shaki: city('Şəki', 'Шеки', 'Shaki'),
  };

  const specialty = (az: string, ru: string, en: string) => {
    const s = { specialtyId: newId(), nameAz: az, nameRu: ru, nameEn: en, isActive: true, createdAt: ts };
    d.specialties.push(s);
    return s.specialtyId;
  };
  const sp: Record<string, string> = {
    cardiology: specialty('Kardioloq', 'Кардиолог', 'Cardiologist'),
    neurology: specialty('Nevroloq', 'Невролог', 'Neurologist'),
    pediatrics: specialty('Pediatr', 'Педиатр', 'Pediatrician'),
    orthopedics: specialty('Ortoped', 'Ортопед', 'Orthopedist'),
    therapist: specialty('Terapevt', 'Терапевт', 'General practitioner'),
    dermatology: specialty('Dermatoloq', 'Дерматолог', 'Dermatologist'),
    endocrinology: specialty('Endokrinoloq', 'Эндокринолог', 'Endocrinologist'),
    gastro: specialty('Qastroenteroloq', 'Гастроэнтеролог', 'Gastroenterologist'),
    gynecology: specialty('Ginekoloq', 'Гинеколог', 'Gynecologist'),
    ophthalmology: specialty('Oftalmoloq', 'Офтальмолог', 'Ophthalmologist'),
    ent: specialty('LOR', 'ЛОР', 'ENT specialist'),
    urology: specialty('Uroloq', 'Уролог', 'Urologist'),
    psychiatry: specialty('Psixiatr', 'Психиатр', 'Psychiatrist'),
    dentistry: specialty('Stomatoloq', 'Стоматолог', 'Dentist'),
  };

  const service = (az: string, ru: string, en: string, category: string) => {
    const s = { serviceId: newId(), nameAz: az, nameRu: ru, nameEn: en, category, isActive: true, createdAt: ts };
    d.services.push(s);
    return s.serviceId;
  };
  const sv: Record<string, string> = {
    initial: service('İlkin müayinə', 'Первичный приём', 'Initial consultation', 'konsultasiya'),
    followUp: service('Təkrar müayinə', 'Повторный приём', 'Follow-up visit', 'konsultasiya'),
    consult: service('Konsultasiya', 'Консультация', 'Consultation', 'konsultasiya'),
    results: service('Nəticələrin şərhi', 'Разбор результатов', 'Results review', 'konsultasiya'),
    echo: service('Exokardioqrafiya', 'Эхокардиография', 'Echocardiography', 'diaqnostika'),
    holter: service('Holter monitorinqinin qurulması', 'Установка холтера', 'Holter monitor setup', 'diaqnostika'),
    ecg: service('EKQ', 'ЭКГ', 'ECG', 'diaqnostika'),
    usm: service('USM', 'УЗИ', 'Ultrasound', 'diaqnostika'),
    mri: service('MRT', 'МРТ', 'MRI', 'diaqnostika'),
    ct: service('KT', 'КТ', 'CT', 'diaqnostika'),
    xray: service('Rentgen', 'Рентген', 'X-ray', 'diaqnostika'),
    lab: service('Analiz', 'Анализы', 'Lab tests', 'laborator'),
    dermatoscopy: service('Dermatoskopiya', 'Дерматоскопия', 'Dermatoscopy', 'diaqnostika'),
    fundus: service('Göz dibinin müayinəsi', 'Осмотр глазного дна', 'Fundus examination', 'diaqnostika'),
    spirometry: service('Spirometriya', 'Спирометрия', 'Spirometry', 'diaqnostika'),
    vaccination: service('Peyvənd', 'Вакцинация', 'Vaccination', 'prosedur'),
    cleaning: service('Diş daşlarının təmizlənməsi', 'Чистка зубов', 'Dental cleaning', 'prosedur'),
  };
  // EF-804-2: ixtisasa bağlı xidmətlər (qalanları istənilən ixtisas üçün uyğundur).
  const svSpecialties: Record<string, string[]> = {
    echo: ['cardiology'], holter: ['cardiology'], ecg: ['cardiology', 'therapist'], dermatoscopy: ['dermatology'],
    fundus: ['ophthalmology'], spirometry: ['therapist', 'pediatrics'], vaccination: ['pediatrics', 'therapist'], cleaning: ['dentistry'],
  };
  for (const [key, specs] of Object.entries(svSpecialties)) d.services.find((s) => s.serviceId === sv[key])!.specialtyIds = specs.map((k) => sp[k]);

  // ── istifadəçilər ──
  let phoneSeq = 0;
  const user = (role: UserRole, p: { fin: string; firstName: string; lastName: string; fatherName: string; birthDate: string; gender: Gender; email?: string; phone?: string }): User => {
    phoneSeq++;
    const u: User = {
      userId: newId(), fin: p.fin, mobileNumber: p.phone ?? `+99450000${String(phoneSeq + 100).padStart(4, '0')}`,
      firstName: p.firstName, lastName: p.lastName, fatherName: p.fatherName, birthDate: p.birthDate, gender: p.gender,
      pinHash, role, status: 'VERIFIED', email: p.email ?? null, photoUrl: null, biometricEnabled: false,
      preferredLanguage: 'az', failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: null, blockedReason: null, deletionRequestedAt: null,
      deletedAt: null, ...stamp,
    };
    d.users.push(u);
    return u;
  };

  user('SUPER_ADMIN', { fin: '1AA1AA1', firstName: 'Rəna', lastName: 'Həsənova', fatherName: 'Əli', birthDate: '1986-02-14', gender: 'FEMALE', email: 'admin@mediconnect.az', phone: '+994500000001' });

  // ── klinikalar və adminləri ──
  const superAdminId = d.users[0].userId;
  const clinicByKey: Record<string, Clinic> = {};
  for (const cs of CLINICS) {
    const c: Clinic = {
      clinicId: newId(), name: cs.name, clinicType: cs.clinicType, registrationNumber: `VÖEN-${1400000000 + Object.keys(clinicByKey).length * 1111}`,
      licenseNumber: `TF-${cs.key.toUpperCase()}-${2024 + (Object.keys(clinicByKey).length % 2)}`, licenseExpiryDate: bakuDate(addDays(now, 400)),
      description: cs.description, cityId: cities[cs.city], district: cs.district, address: cs.address, latitude: cs.lat, longitude: cs.lng,
      phone: cs.phone, email: cs.email ?? null, website: cs.website ?? null, logoUrl: null, status: cs.status ?? 'ACTIVE',
      verifiedBy: cs.status === 'PENDING_VERIFICATION' ? null : superAdminId, verifiedAt: cs.status === 'PENDING_VERIFICATION' ? null : ts,
      avgRating: null, acceptingAppointments: true, insurances: cs.insurances, foundedYear: cs.foundedYear, is24x7: cs.is24x7 ?? false, ...stamp,
    };
    d.clinics.push(c);
    clinicByKey[cs.key] = c;
    for (let day = 1; day <= 7; day++) {
      const row = cs.hours.find(([days]) => days.includes(day));
      d.clinic_working_hours.push({ workingHourId: newId(), clinicId: c.clinicId, dayOfWeek: day, opensAt: row?.[1] ?? null, closesAt: row?.[2] ?? null, isClosed: !row });
    }
    if (cs.admin) {
      const u = user('CLINIC_ADMIN', cs.admin);
      d.clinic_admins.push({ clinicAdminId: newId(), userId: u.userId, clinicId: c.clinicId, status: 'ACTIVE', inviteToken: null, inviteExpiresAt: null, createdAt: ts });
    }
  }

  // ── həkimlər, bağlantılar, cədvəllər, xidmətlər ──
  const doctorClinics: { doctorKey: string; dc: DoctorClinic; start: string }[] = [];
  const doctorIdByKey: Record<string, string> = {};
  for (const ds of DOCTORS) {
    const u = user('DOCTOR', ds);
    const doctorId = newId();
    doctorIdByKey[ds.key] = doctorId;
    d.doctors.push({
      doctorId, userId: u.userId, licenseNumber: `AZ-${ds.specialties[0].slice(0, 3).toUpperCase()}-${20000 + d.doctors.length * 137}`,
      licenseExpiryDate: bakuDate(addDays(now, ds.licenseDays ?? 500)), licenseDocumentUrl: null, bio: ds.bio || null,
      education: ds.education.join('\n') || null, experienceYears: ds.experienceYears, academicDegree: ds.academicDegree,
      approvalMode: ds.approvalMode, profileCompleted: ds.profileCompleted ?? true, avgRating: null, reviewCount: 0,
      specializationAreas: ds.areas, certificates: ds.certificates ?? [], // Dr. Rəşadın imza sertifikatı bitib — EF-601-2 demosu.
      signatureCertExpiry: bakuDate(addDays(now, ds.key === 'resad' ? -20 : 365)), ...stamp,
    });
    ds.specialties.forEach((key, i) => d.doctor_specialties.push({ doctorSpecialtyId: newId(), doctorId, specialtyId: sp[key], isPrimary: i === 0 }));
    ds.languages.forEach((languageCode) => d.doctor_languages.push({ doctorLanguageId: newId(), doctorId, languageCode }));

    for (const link of ds.clinics) {
      const dc: DoctorClinic = {
        doctorClinicId: newId(), doctorId, clinicId: clinicByKey[link.clinic].clinicId, status: link.status ?? 'ACTIVE', roomNumber: link.room,
        invitedBy: null, inviteToken: null, inviteExpiresAt: null, joinedAt: ts, removedAt: null, slotsGeneratedUntil: null, createdAt: ts,
      };
      d.doctor_clinics.push(dc);
      doctorClinics.push({ doctorKey: ds.key, dc, start: link.schedule[0]?.start ?? '10:00' });
      for (const sch of link.schedule) {
        for (const day of sch.days) {
          const scheduleId = newId();
          d.doctor_schedules.push({ scheduleId, doctorClinicId: dc.doctorClinicId, dayOfWeek: day, startTime: sch.start, endTime: sch.end, slotDurationMinutes: sch.slot, bufferMinutes: 0, isActive: true, updatedBy: null, ...stamp });
          for (const [start, end, name] of sch.breaks ?? []) d.schedule_breaks.push({ breakId: newId(), scheduleId, breakStart: start, breakEnd: end, breakName: name });
        }
      }
      for (const [svKey, minutes] of link.services) {
        d.clinic_doctor_services.push({ clinicDoctorServiceId: newId(), doctorClinicId: dc.doctorClinicId, serviceId: sv[svKey], durationMinutes: minutes, isActive: true, createdAt: ts });
      }
    }
  }

  // ── pasientlər ──
  const patient = (u: User, p: Partial<Patient> = {}): Patient => {
    const pt: Patient = {
      patientId: newId(), userId: u.userId, bloodType: null, address: null, secondaryPhone: null, emergencyContactName: null,
      emergencyContactPhone: null, medicalConsent: true, consentGivenAt: ts, consentVersion: '1.0', noShowCount: 0,
      regularMedications: [], ...stamp, ...p,
    };
    d.patients.push(pt);
    return pt;
  };
  // ── dərman kataloqu və qarşılıqlı təsirlər (UC-601, UC-904) ──
  const drugId: Record<string, string> = {};
  for (const x of DRUGS) {
    drugId[x.key] = newId();
    d.drugs.push({ drugId: drugId[x.key], tradeName: x.tradeName, genericName: x.genericName, drugClass: x.drugClass, patientInfo: x.info, form: x.form, strength: x.strength, isControlled: !!x.controlled, isActive: true, createdAt: ts });
  }
  for (const x of INTERACTIONS)
    d.drug_interactions.push({ interactionId: newId(), drugId1: drugId[x.a], drugId2: drugId[x.b], severity: x.severity, description: x.description, createdAt: ts });

  const nigarUser = user('PATIENT', { fin: '6NS35AA', firstName: 'Nigar', lastName: 'Səlimova', fatherName: 'Arif', birthDate: '1991-03-28', gender: 'FEMALE', email: 'nigar@example.az', phone: '+994500000020' });
  const nigar = patient(nigarUser, {
    bloodType: 'A+', address: 'Bakı, Nərimanov r., Təbriz küç. 18', emergencyContactName: 'Arif Səlimov', emergencyContactPhone: '+994502223344',
    regularMedications: [{ drugId: drugId.lisinopril, name: 'Lizinopril 10 mq' }],
  });
  d.patient_allergies.push({ allergyId: newId(), patientId: nigar.patientId, allergenName: 'Penisilin', drugId: null, severity: 'SEVERE', notes: null, createdAt: ts });
  d.patient_chronic_conditions.push({ conditionId: newId(), patientId: nigar.patientId, conditionName: 'Arterial hipertenziya', icd10Code: 'I10', diagnosedDate: '2021-06-01', createdAt: ts });
  patient(user('PATIENT', { fin: '4OS77BB', firstName: 'Orxan', lastName: 'Səfərov', fatherName: 'Elçin', birthDate: '1988-09-10', gender: 'MALE', phone: '+994500000021' }), { noShowCount: 4 });
  patient(user('PATIENT', { fin: '9SE12CC', firstName: 'Səbinə', lastName: 'Əhmədova', fatherName: 'Vasif', birthDate: '2000-01-07', gender: 'FEMALE', phone: '+994500000022' }));
  const reviewers = REVIEWER_PATIENTS.map((p) => patient(user('PATIENT', p)));

  // ── keçmiş tamamlanmış qəbullar və dərc olunmuş rəylər (reytinqlər bunlardan hesablanır — BR-1101-07) ──
  let refSeq = 0;
  const pastAppointment = (dc: DoctorClinic, patientId: string, date: string, startTime: string, serviceId: string) => {
    const slotId = newId();
    const endTime = minutesToTime(timeToMinutes(startTime) + 30);
    d.appointment_slots.push({ slotId, doctorClinicId: dc.doctorClinicId, slotDate: date, startTime, endTime, status: 'BOOKED', lockedBy: null, lockedUntil: null, blockedReason: null, ...stamp });
    const startAt = bakuToUtc(date, startTime);
    const appointmentId = newId();
    refSeq++;
    d.appointments.push({
      appointmentId, bookingReference: `MC-${date.slice(0, 4)}-${date.slice(5, 7)}${date.slice(8, 10)}-${String(1000 + refSeq).slice(-4)}`,
      patientId, doctorClinicId: dc.doctorClinicId, slotId, slotIds: [slotId], serviceId, status: 'COMPLETED',
      startAt: startAt.toISOString(), endAt: addMinutes(startAt, 30).toISOString(), patientNote: null, doctorNote: 'Müayinə aparıldı, tövsiyələr verildi.',
      rescheduleCount: 0, cancelledBy: null, cancellationReason: null, cancelledAt: null, completedAt: addMinutes(startAt, 30).toISOString(),
      pendingReschedule: null, reviewInvited: true, createdAt: addDays(startAt, -3).toISOString(), updatedAt: addMinutes(startAt, 30).toISOString(),
    });
    d.appointment_status_history.push({ historyId: newId(), appointmentId, oldStatus: null, newStatus: 'CONFIRMED', changedBy: null, changeReason: null, oldSlotId: null, changedAt: addDays(startAt, -3).toISOString() });
    d.appointment_status_history.push({ historyId: newId(), appointmentId, oldStatus: 'CONFIRMED', newStatus: 'COMPLETED', changedBy: null, changeReason: null, oldSlotId: null, changedAt: addMinutes(startAt, 30).toISOString() });
    return { appointmentId, startAt };
  };

  const usedDays = new Set<string>();
  for (const ds of DOCTORS.filter((x) => x.reviews > 0)) {
    const links = doctorClinics.filter((x) => x.doctorKey === ds.key);
    const ratings = ratingsFor(ds.targetRating, ds.reviews, rand);
    ratings.forEach((rating, i) => {
      const link = links[i % links.length];
      const workDays = ds.clinics.find((c) => clinicByKey[c.clinic].clinicId === link.dc.clinicId)!.schedule.flatMap((s) => s.days);
      // Keçmişdə həkimin iş gününə düşən tarix.
      let date = addDaysToDate(today, -(4 + i * 5));
      while ((workDays.length && !workDays.includes(bakuDayOfWeek(date))) || usedDays.has(`${link.dc.doctorClinicId}|${date}`)) date = addDaysToDate(date, -1);
      usedDays.add(`${link.dc.doctorClinicId}|${date}`);
      const isNigar = ds.key === 'aygun' && i === 0;
      const reviewer = isNigar ? nigar : reviewers[(i + ds.key.length) % reviewers.length];
      const svKey = ds.clinics.find((c) => clinicByKey[c.clinic].clinicId === link.dc.clinicId)!.services[0][0];
      const { appointmentId, startAt } = pastAppointment(link.dc, reviewer.patientId, date, link.start, sv[svKey]);
      const pool = REVIEW_COMMENTS[rating] ?? REVIEW_COMMENTS[4];
      const comment = isNigar ? REVIEW_COMMENTS[5][0] : rand() < 0.2 ? null : pool[Math.floor(rand() * pool.length)];
      const sub = () => Math.max(1, Math.min(5, rating + (rand() < 0.25 ? -1 : rand() > 0.85 ? 1 : 0)));
      const createdAt = addDays(startAt, 1).toISOString();
      d.reviews.push({
        reviewId: newId(), appointmentId, patientId: reviewer.patientId, doctorId: doctorIdByKey[ds.key], overallRating: rating,
        professionalismRating: sub(), attitudeRating: sub(), waitingTimeRating: sub(), comment, isAnonymous: rand() < 0.15,
        status: 'PUBLISHED', filterFlags: [], moderatedBy: superAdminId, moderatedAt: createdAt, rejectionReason: null, publishedSnapshot: null,
        createdAt, updatedAt: createdAt,
      });
    });
  }

  // ── UC-903 demosu: moderasiya növbəsi ──
  d.moderation_filter_rules.push({ ruleId: newId(), bannedWords: [...DEFAULT_BANNED], sensitivity: 'MEDIUM', updatedBy: null, updatedAt: ts });
  const pendingSamples: { key: string; rating: number; comment: string | null; flags: string[]; anon?: boolean }[] = [
    { key: 'aygun', rating: 5, comment: 'Çox diqqətli həkimdir, hər şeyi səbirlə izah etdi. Tövsiyə edirəm.', flags: [] },
    { key: 'leyla', rating: 4, comment: 'Yaxşı qəbul idi, sualınız olsa 050 123 45 67 nömrəsinə yazın, təcrübəmi bölüşərəm.', flags: ['PERSONAL_DATA'] },
    { key: 'kamran', rating: 3, comment: 'Diaqnoz qoyuldu, diabet üçün Siofor yazdı, amma gözləmə uzun çəkdi.', flags: ['MEDICAL_DETAIL'], anon: true },
    { key: 'aygun', rating: 4, comment: null, flags: [] },
  ];
  pendingSamples.forEach((p, i) => {
    const link = doctorClinics.find((x) => x.doctorKey === p.key);
    if (!link) return;
    let date = addDaysToDate(today, -(2 + i));
    while (usedDays.has(`${link.dc.doctorClinicId}|${date}`)) date = addDaysToDate(date, -1);
    usedDays.add(`${link.dc.doctorClinicId}|${date}`);
    const author = reviewers[(i + 3) % reviewers.length];
    const svKey = DOCTORS.find((x) => x.key === p.key)!.clinics.find((c) => clinicByKey[c.clinic].clinicId === link.dc.clinicId)!.services[0][0];
    const { appointmentId, startAt } = pastAppointment(link.dc, author.patientId, date, link.start, sv[svKey]);
    const createdAt = addMinutes(startAt, 180).toISOString();
    d.reviews.push({
      reviewId: newId(), appointmentId, patientId: author.patientId, doctorId: doctorIdByKey[p.key], overallRating: p.rating, professionalismRating: p.rating,
      attitudeRating: p.rating, waitingTimeRating: Math.max(1, p.rating - 1), comment: p.comment, isAnonymous: !!p.anon, status: 'PENDING_MODERATION',
      filterFlags: p.flags, moderatedBy: null, moderatedAt: null, rejectionReason: null, publishedSnapshot: null, createdAt, updatedAt: createdAt,
    });
  });
  // Dr. Aygün dərc olunmuş bir rəyi şikayət edib, digərinə cavab yazıb (hər ikisi baxılmağı gözləyir).
  const aygunPublished = d.reviews.filter((r) => r.doctorId === doctorIdByKey.aygun && r.status === 'PUBLISHED' && r.comment).sort((a, b) => a.overallRating - b.overallRating);
  const aygunUser = d.users.find((u) => u.fin === '3KL88MN')!;
  if (aygunPublished[0]) {
    aygunPublished[0].status = 'REPORTED';
    d.review_reports.push({ reportId: newId(), reviewId: aygunPublished[0].reviewId, reportedBy: aygunUser.userId, reportReason: 'Bu pasient mənim qəbulumda olmayıb, rəy başqa həkimə aiddir.', resolution: 'PENDING', resolvedBy: null, createdAt: ts });
  }
  if (aygunPublished[1])
    d.review_replies.push({ replyId: newId(), reviewId: aygunPublished[1].reviewId, doctorId: doctorIdByKey.aygun, replyText: 'Rəyiniz üçün təşəkkür edirəm! Növbəti qəbulda gözləmə vaxtını azaltmağa çalışacağıq.', status: 'PENDING_MODERATION', createdAt: ts, filterFlags: [], rejectionReason: null });

  // Nigar: keçmiş tamamlanmış (rəy yazılmayıb — UC-1101 demosu) və ləğv edilmiş randevu.
  const leylaLink = doctorClinics.find((x) => x.doctorKey === 'leyla')!;
  let nigarPastDate = addDaysToDate(today, -6);
  while (bakuDayOfWeek(nigarPastDate) > 5 || usedDays.has(`${leylaLink.dc.doctorClinicId}|${nigarPastDate}`)) nigarPastDate = addDaysToDate(nigarPastDate, -1);
  pastAppointment(leylaLink.dc, nigar.patientId, nigarPastDate, '10:00', sv.initial);
  const aygunLink = doctorClinics.find((x) => x.doctorKey === 'aygun')!;
  let cancelledDate = addDaysToDate(today, -12);
  while (bakuDayOfWeek(cancelledDate) !== 1 && bakuDayOfWeek(cancelledDate) !== 3) cancelledDate = addDaysToDate(cancelledDate, -1);
  const cancelled = pastAppointment(aygunLink.dc, nigar.patientId, cancelledDate, '15:00', sv.followUp);
  const ca = d.appointments.find((x) => x.appointmentId === cancelled.appointmentId)!;
  Object.assign(ca, { status: 'CANCELLED', completedAt: null, doctorNote: null, cancelledBy: nigarUser.userId, cancellationReason: 'Planlarım dəyişdi', cancelledAt: addDays(cancelled.startAt, -1).toISOString() });
  d.appointment_slots.find((x) => x.slotId === ca.slotId)!.status = 'AVAILABLE';
  const lastHistory = d.appointment_status_history.filter((h) => h.appointmentId === ca.appointmentId).at(-1)!;
  Object.assign(lastHistory, { newStatus: 'CANCELLED', changedBy: nigarUser.userId, changeReason: 'Planlarım dəyişdi', changedAt: ca.cancelledAt });

  // Nigarın tibbi sənədləri (şifrələnmiş storage-a yazılır) + Dr. Aygünə 2 gün sonra bitən icazə.
  const docRow = (fileName: string, category: 'LAB_RESULT' | 'IMAGING' | 'EPICRISIS' | 'OTHER', daysAgo: number, body: Buffer, mime: string, description: string | null) => {
    const { storagePath, encryptionKeyId } = putEncrypted(body);
    const row = { documentId: newId(), patientId: nigar.patientId, category, fileName, storagePath, fileSizeBytes: body.length, mimeType: mime, encryptionKeyId, documentDate: addDaysToDate(today, -daysAgo), description, virusScanStatus: 'CLEAN' as const, isArchived: false, uploadedAt: addDays(now, -daysAgo + 1).toISOString(), deletedAt: null };
    d.medical_documents.push(row);
    return row;
  };
  const blood = docRow('Qan analizi.pdf', 'LAB_RESULT', 70, makePdf('Ümumi qan analizi', ['Hemoqlobin: 128 q/l (norma 120-160)', 'Leykositlər: 6.4 x10^9/l', 'Trombositlər: 245 x10^9/l', 'Xolesterin: 5.9 mmol/l (yüksək)', 'Qlükoza: 5.1 mmol/l']), 'application/pdf', 'İllik müayinə');
  docRow('EKQ nəticəsi.png', 'LAB_RESULT', 50, makeEcgPng(), 'image/png', 'Sinus ritmi');
  docRow('Exokardioqrafiya protokolu.pdf', 'IMAGING', 100, makePdf('Exokardioqrafiya protokolu', ['Sol mədəcik: normal ölçüdə', 'Atım fraksiyası: 62%', 'Qapaqlar: patologiya aşkarlanmadı']), 'application/pdf', null);
  const epi = docRow('Epikriz 2024.pdf', 'EPICRISIS', 600, makePdf('Epikriz', ['Diaqnoz: Arterial hipertenziya, II mərhələ', 'Stasionarda müalicə: 5 gün', 'Tövsiyə: kardioloq nəzarəti']), 'application/pdf', 'Xəstəxanadan çıxarış');
  epi.isArchived = true;
  const aygunDoctorId = doctorIdByKey.aygun;
  const aygunUserId = d.users.find((u) => u.fin === '3KL88MN')!.userId;
  const grantedAt = addDays(now, -28);
  const g = { grantId: newId(), documentId: blood.documentId, doctorId: aygunDoctorId, grantedBy: nigar.patientId, accessDuration: 'THIRTY_DAYS' as const, status: 'ACTIVE' as const, appointmentId: null, viewCount: 2, grantedAt: grantedAt.toISOString(), expiresAt: addDays(grantedAt, 30).toISOString(), revokedAt: null };
  d.document_access_grants.push(g);
  for (const daysAgo of [27, 20]) d.document_access_log.push({ accessLogId: newId(), documentId: blood.documentId, grantId: g.grantId, accessedBy: aygunUserId, accessType: 'VIEW', ipAddress: '127.0.0.1', accessedAt: addDays(now, -daysAgo).toISOString() });

  return d;
}

/** Store-u seed ilə əvəz edir (və persist aktivdirsə diskə yazır). Default olaraq saatı real vaxta qaytarır. */
export function seed(opts: { keepClock?: boolean } = {}) {
  if (!opts.keepClock) clock.reset();
  resetStorage(); // şifrələnmiş fayllar və açarlar da sıfırlanır
  replaceDb(buildSeed());
  rollSlotGeneration(); // gələcək 60 gün üçün slotlar (BR-702-06)
  seedScenarios(); // demo randevuları (real lock → create axını ilə)
  recalculateAll(); // reytinqlər yalnız dərc olunmuş rəylərdən
  saveNow();
}
