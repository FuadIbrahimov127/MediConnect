import type { ClinicServiceDto, ClinicServiceSaveDto, ClinicServicesDto } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { audit } from '../core/audit';
import { clock } from '../core/clock';
import { ApiError } from '../core/errors';
import { db } from '../store/db';
import { newId } from '../store/repo';
import type { DoctorClinic } from '../store/types';
import { adminClinic, clinicDcs } from './clinic-admin.service';
import { doctorFullName } from './visibility';

// UC-804 — klinikanın xidmətləri. Kataloq Super Admin-indir (BR-804-01/02): klinika yalnız seçir, həkimlərə bağlayır,
// müddət təyin edir. Qiymət sahəsi yoxdur (BR-804-03). Müddət dəyişikliyi mövcud randevulara təsir etmir (BR-804-07).

const ACTIVE_APPT = ['PENDING', 'CONFIRMED'];
const linkable = (dc: DoctorClinic) => dc.status === 'ACTIVE' || dc.status === 'INACTIVE' || dc.status === 'INVITED';

function upcomingWithService(clinicId: string, serviceId: string) {
  const ids = new Set(clinicDcs(clinicId).map((x) => x.doctorClinicId));
  return db.appointments.filter((a) => ids.has(a.doctorClinicId) && a.serviceId === serviceId && ACTIVE_APPT.includes(a.status) && new Date(a.startAt).getTime() > clock.nowMs());
}

const slotDuration = (dcId: string) => db.doctor_schedules.find((s) => s.doctorClinicId === dcId && s.isActive)?.slotDurationMinutes ?? null;

export function listClinicServices(actor: Actor): ClinicServicesDto {
  const c = adminClinic(actor);
  const dcs = clinicDcs(c.clinicId).filter(linkable);
  const rows = db.clinic_doctor_services.filter((r) => dcs.some((d) => d.doctorClinicId === r.doctorClinicId));
  const serviceIds = [...new Set(rows.map((r) => r.serviceId))];
  const services: ClinicServiceDto[] = serviceIds
    .map((id) => {
      const s = db.services.find((x) => x.serviceId === id)!;
      const mine = rows.filter((r) => r.serviceId === id);
      return {
        serviceId: id, name: s.nameAz, category: s.category,
        // Alt 1: klinika səviyyəsində deaktiv = bütün həkim bağlantıları passivdir.
        isActive: s.isActive && mine.some((r) => r.isActive),
        doctors: mine
          .filter((r) => r.isActive || !mine.some((x) => x.isActive))
          .map((r) => {
            const dc = dcs.find((d) => d.doctorClinicId === r.doctorClinicId)!;
            return { doctorId: dc.doctorId, fullName: doctorFullName(db.doctors.find((d) => d.doctorId === dc.doctorId)!), durationMinutes: r.durationMinutes, slotDurationMinutes: slotDuration(dc.doctorClinicId) };
          }),
        upcomingAppointments: upcomingWithService(c.clinicId, id).length,
      };
    })
    .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '') || a.name.localeCompare(b.name, 'az')); // FR-804-10
  return {
    services,
    catalog: db.services.filter((s) => s.isActive).map((s) => ({ serviceId: s.serviceId, name: s.nameAz, category: s.category, added: serviceIds.includes(s.serviceId) })),
    doctors: dcs.map((dc) => {
      const d = db.doctors.find((x) => x.doctorId === dc.doctorId)!;
      return { doctorId: d.doctorId, fullName: doctorFullName(d), specialties: db.doctor_specialties.filter((x) => x.doctorId === d.doctorId).map((x) => db.specialties.find((s) => s.specialtyId === x.specialtyId)!.nameAz) };
    }),
    requests: db.service_requests.filter((r) => r.clinicId === c.clinicId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => ({ requestId: r.requestId, name: r.name, status: r.status, createdAt: r.createdAt })),
  };
}

/** Xəbərdarlıqlar: ixtisas uyğunsuzluğu (EF-804-2), müddət slotdan uzun (EF-804-3). Bloklamır. */
function warningsFor(serviceId: string, doctors: { doctorId: string; durationMinutes: number }[], dcs: DoctorClinic[]): string[] {
  const s = db.services.find((x) => x.serviceId === serviceId)!;
  const out: string[] = [];
  for (const d of doctors) {
    const doc = db.doctors.find((x) => x.doctorId === d.doctorId)!;
    const specs = db.doctor_specialties.filter((x) => x.doctorId === d.doctorId).map((x) => x.specialtyId);
    if (s.specialtyIds?.length && !specs.some((x) => s.specialtyIds!.includes(x))) out.push(`"${s.nameAz}" xidməti ${doctorFullName(doc)}-un ixtisası ilə uyğun gəlmir`);
    const slot = slotDuration(dcs.find((x) => x.doctorId === d.doctorId)!.doctorClinicId);
    if (slot && d.durationMinutes > slot) out.push(`${doctorFullName(doc)}: ${d.durationMinutes} dəq. xidmət ${slot} dəqiqəlik slotdan uzundur — ${Math.ceil(d.durationMinutes / slot)} ardıcıl slot birləşdiriləcək`);
  }
  return out;
}

function resolveDoctors(clinicId: string, doctors: { doctorId: string; durationMinutes: number }[]) {
  if (!doctors.length) throw new ApiError('ValidationError', { fields: { doctors: 'validation.serviceDoctors' } }); // EF-804-4, BR-804-06
  const dcs = clinicDcs(clinicId).filter(linkable);
  for (const d of doctors) if (!dcs.some((x) => x.doctorId === d.doctorId)) throw new ApiError('ValidationError', { fields: { doctors: 'Həkim bu klinikada deyil' } });
  return dcs;
}

export function addClinicService(actor: Actor, input: { serviceId: string; doctors: { doctorId: string; durationMinutes: number }[] }): ClinicServiceSaveDto {
  const c = adminClinic(actor);
  const s = db.services.find((x) => x.serviceId === input.serviceId && x.isActive);
  if (!s) throw new ApiError('ValidationError', { fields: { serviceId: 'Xidmət mərkəzi kataloqda yoxdur' } }); // FR-804-03
  const dcs = resolveDoctors(c.clinicId, input.doctors);
  if (db.clinic_doctor_services.some((r) => r.serviceId === s.serviceId && r.isActive && dcs.some((d) => d.doctorClinicId === r.doctorClinicId)))
    throw new ApiError('Conflict', undefined, 'Bu xidmət artıq klinikada var — redaktə edin');
  return setDoctors(actor, c.clinicId, s.serviceId, input.doctors, dcs, 'ADD_CLINIC_SERVICE');
}

function setDoctors(actor: Actor, clinicId: string, serviceId: string, doctors: { doctorId: string; durationMinutes: number }[], dcs: DoctorClinic[], action: string): ClinicServiceSaveDto {
  const now = clock.nowIso();
  for (const dc of dcs) {
    const want = doctors.find((d) => d.doctorId === dc.doctorId);
    const row = db.clinic_doctor_services.find((r) => r.doctorClinicId === dc.doctorClinicId && r.serviceId === serviceId);
    if (row) {
      row.isActive = !!want;
      if (want) row.durationMinutes = want.durationMinutes;
    } else if (want) {
      db.clinic_doctor_services.push({ clinicDoctorServiceId: newId(), doctorClinicId: dc.doctorClinicId, serviceId, durationMinutes: want.durationMinutes, isActive: true, createdAt: now });
    }
  }
  audit(actor, { action, entityType: 'CLINIC_SERVICE', entityId: serviceId, newValue: { clinicId, doctors } });
  return { services: listClinicServices(actor), warnings: warningsFor(serviceId, doctors, dcs) };
}

export function updateClinicService(actor: Actor, serviceId: string, input: { doctors?: { doctorId: string; durationMinutes: number }[]; isActive?: boolean }): ClinicServiceSaveDto {
  const c = adminClinic(actor);
  const dcs = clinicDcs(c.clinicId).filter(linkable);
  const rows = db.clinic_doctor_services.filter((r) => r.serviceId === serviceId && dcs.some((d) => d.doctorClinicId === r.doctorClinicId));
  if (!rows.length) throw new ApiError('NotFound');
  if (input.doctors) return setDoctors(actor, c.clinicId, serviceId, input.doctors, resolveDoctors(c.clinicId, input.doctors), 'UPDATE_CLINIC_SERVICE');
  if (input.isActive !== undefined) {
    // Alt 1: deaktiv xidmət yeni randevu üçün seçilmir, mövcud randevular qalır. Aktivləşdirmədə son həkim siyahısı bərpa olunur.
    for (const r of rows) r.isActive = input.isActive;
    audit(actor, { action: input.isActive ? 'ACTIVATE_CLINIC_SERVICE' : 'DEACTIVATE_CLINIC_SERVICE', entityType: 'CLINIC_SERVICE', entityId: serviceId, newValue: { clinicId: c.clinicId } });
  }
  return { services: listClinicServices(actor), warnings: [] };
}

/** Alt 2 / EF-804-1: aktiv randevusu olan xidmət silinmir (BR-804-05). */
export function removeClinicService(actor: Actor, serviceId: string): ClinicServicesDto {
  const c = adminClinic(actor);
  const ids = new Set(clinicDcs(c.clinicId).map((x) => x.doctorClinicId));
  if (!db.clinic_doctor_services.some((r) => r.serviceId === serviceId && ids.has(r.doctorClinicId))) throw new ApiError('NotFound');
  const upcoming = upcomingWithService(c.clinicId, serviceId);
  if (upcoming.length) throw new ApiError('HasActiveAppointments', { count: upcoming.length }, `Bu xidmət üzrə ${upcoming.length} aktiv randevu var — əvvəlcə onlar tamamlanmalı və ya ləğv edilməlidir`);
  // Keçmiş randevular xidmətin özünə (kataloq) istinad edir, bağlantıya yox — bağlantılar silinə bilər.
  db.clinic_doctor_services = db.clinic_doctor_services.filter((x) => !(x.serviceId === serviceId && ids.has(x.doctorClinicId)));
  audit(actor, { action: 'REMOVE_CLINIC_SERVICE', entityType: 'CLINIC_SERVICE', entityId: serviceId, newValue: { clinicId: c.clinicId } });
  return listClinicServices(actor);
}

/** Alt 4: kataloqda olmayan xidmət üçün Super Admin-ə tələb. */
export function requestService(actor: Actor, input: { name: string; category?: string; note?: string }): ClinicServicesDto {
  const c = adminClinic(actor);
  const requestId = newId();
  db.service_requests.push({ requestId, clinicId: c.clinicId, name: input.name, category: input.category ?? null, note: input.note ?? null, status: 'PENDING', requestedBy: actor.userId!, createdAt: clock.nowIso(), resolvedAt: null });
  audit(actor, { action: 'REQUEST_CATALOG_SERVICE', entityType: 'SERVICE_REQUEST', entityId: requestId, newValue: input });
  return listClinicServices(actor);
}
