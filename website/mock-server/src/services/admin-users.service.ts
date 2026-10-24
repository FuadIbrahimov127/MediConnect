import type { AdminUserDetailDto, AdminUserRowDto, AdminUsersDto } from '@mediconnect/shared';
import { ROLE_LABEL } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { audit } from '../core/audit';
import { isSessionActive, revokeUserSessions } from '../core/auth';
import { bakuDate, clock } from '../core/clock';
import { randomDigits } from '../core/crypto';
import { ApiError } from '../core/errors';
import { db } from '../store/db';
import { paginate } from '../store/repo';
import type { User } from '../store/types';
import { cancelAppointment } from './appointments.service';
import { revokeDeviceTokens } from './auth.service';
import { notify } from './notifications.service';

// UC-902 — istifadəçilərin idarəsi. Super Admin yalnız hesab metadata-sını görür (BR-902-02): detalda tibbi sənədin
// məzmunu, resept, diaqnoz, şikayət mətni yoxdur — yalnız saylar. Hər əməliyyat səbəb tələb edir (BR-902-03).

const ACTIVE_APPT = ['PENDING', 'CONFIRMED'];
const fullName = (u: User) => `${u.firstName} ${u.lastName}`;

function assertSuperAdmin(actor: Actor) {
  if (actor.role !== 'SUPER_ADMIN') throw new ApiError('Forbidden');
}

function loadUser(actor: Actor, userId: string): User {
  assertSuperAdmin(actor);
  const u = db.users.find((x) => x.userId === userId);
  if (!u) throw new ApiError('NotFound');
  return u;
}

function clinicsOf(u: User): string[] {
  const name = (id: string) => db.clinics.find((c) => c.clinicId === id)?.name ?? '';
  if (u.role === 'DOCTOR') {
    const d = db.doctors.find((x) => x.userId === u.userId);
    return d ? db.doctor_clinics.filter((x) => x.doctorId === d.doctorId && x.status !== 'REMOVED').map((x) => name(x.clinicId)) : [];
  }
  if (u.role === 'CLINIC_ADMIN') return db.clinic_admins.filter((a) => a.userId === u.userId && a.status !== 'REMOVED').map((a) => name(a.clinicId));
  return [];
}

const clinicIdsOf = (u: User): string[] => {
  if (u.role === 'DOCTOR') {
    const d = db.doctors.find((x) => x.userId === u.userId);
    return d ? db.doctor_clinics.filter((x) => x.doctorId === d.doctorId && x.status !== 'REMOVED').map((x) => x.clinicId) : [];
  }
  if (u.role === 'CLINIC_ADMIN') return db.clinic_admins.filter((a) => a.userId === u.userId && a.status !== 'REMOVED').map((a) => a.clinicId);
  return [];
};

const toRow = (u: User): AdminUserRowDto => ({
  userId: u.userId, fullName: fullName(u), fin: u.fin, mobileNumber: u.mobileNumber, role: u.role, status: u.status, createdAt: u.createdAt,
  lastLoginAt: u.lastLoginAt, clinics: clinicsOf(u), deletionRequested: !!u.deletionRequestedAt && u.status !== 'DELETED',
});

/** FR-902-A: rol/status/klinika/tarix filtri, FIN, telefon və ad üzrə axtarış (alt 1). */
export function listUsers(actor: Actor, q: { role?: string; status?: string; clinicId?: string; q?: string; from?: string; to?: string; page: number; size: number }): AdminUsersDto {
  assertSuperAdmin(actor);
  const needle = q.q?.toLocaleLowerCase('az').replace(/\s+/g, '');
  const roles = q.role ? q.role.split(',') : null;
  const list = db.users
    .filter((u) => {
      if (roles && !roles.includes(u.role)) return false;
      if (q.status === 'DELETION_REQUESTED') {
        if (!u.deletionRequestedAt || u.status === 'DELETED') return false;
      } else if (q.status && u.status !== q.status) return false;
      if (q.clinicId && !clinicIdsOf(u).includes(q.clinicId)) return false;
      const created = bakuDate(new Date(u.createdAt));
      if ((q.from && created < q.from) || (q.to && created > q.to)) return false;
      if (needle) {
        const hay = [u.fin, u.mobileNumber, `${u.firstName}${u.lastName}`, `${u.lastName}${u.firstName}`].join('|').toLocaleLowerCase('az');
        if (!hay.includes(needle)) return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const page = paginate(list, q.page, q.size);
  return { totalCount: page.totalCount, page: page.page, size: page.size, users: page.items.map(toRow) };
}

function statsFor(u: User): AdminUserDetailDto['stats'] {
  if (u.role === 'PATIENT') {
    const p = db.patients.find((x) => x.userId === u.userId);
    if (!p) return [];
    const appts = db.appointments.filter((a) => a.patientId === p.patientId);
    return [
      { label: 'Randevu (cəmi)', value: appts.length },
      { label: 'Gələcək randevu', value: appts.filter((a) => ACTIVE_APPT.includes(a.status) && new Date(a.startAt).getTime() > clock.nowMs()).length },
      { label: 'Tamamlanmış', value: appts.filter((a) => a.status === 'COMPLETED').length },
      { label: 'Gəlməmə sayı', value: p.noShowCount },
      // Görmə matrisi: sənədin yalnız metadata-sı — burada yalnız say.
      { label: 'Tibbi sənəd (say)', value: db.medical_documents.filter((d) => d.patientId === p.patientId && !d.deletedAt).length },
    ];
  }
  if (u.role === 'DOCTOR') {
    const d = db.doctors.find((x) => x.userId === u.userId);
    if (!d) return [];
    const dcIds = new Set(db.doctor_clinics.filter((x) => x.doctorId === d.doctorId).map((x) => x.doctorClinicId));
    const appts = db.appointments.filter((a) => dcIds.has(a.doctorClinicId));
    return [
      { label: 'Lisenziya', value: `${d.licenseNumber} · ${d.licenseExpiryDate}-dək` },
      { label: 'Profil', value: d.profileCompleted ? 'tamamlanıb' : 'tamamlanmayıb' },
      { label: 'Randevu (cəmi)', value: appts.length },
      { label: 'Gələcək randevu', value: appts.filter((a) => ACTIVE_APPT.includes(a.status) && new Date(a.startAt).getTime() > clock.nowMs()).length },
      { label: 'Reytinq', value: d.avgRating ? `${d.avgRating.toFixed(1)} (${d.reviewCount})` : '—' },
    ];
  }
  if (u.role === 'CLINIC_ADMIN') return [{ label: 'Klinika', value: clinicsOf(u).join(', ') || '—' }];
  return [];
}

/** EF-902-1 və EF-902-2 üçün əvvəlcədən xəbərdarlıqlar. */
function risks(u: User) {
  const out: { futureAppointments: string[]; soleAdminOf: string[] } = { futureAppointments: [], soleAdminOf: [] };
  if (u.role === 'DOCTOR') {
    const d = db.doctors.find((x) => x.userId === u.userId);
    const dcIds = new Set(d ? db.doctor_clinics.filter((x) => x.doctorId === d.doctorId).map((x) => x.doctorClinicId) : []);
    out.futureAppointments = db.appointments.filter((a) => dcIds.has(a.doctorClinicId) && ACTIVE_APPT.includes(a.status) && new Date(a.startAt).getTime() > clock.nowMs()).map((a) => a.appointmentId);
  }
  if (u.role === 'PATIENT') {
    const p = db.patients.find((x) => x.userId === u.userId);
    out.futureAppointments = p ? db.appointments.filter((a) => a.patientId === p.patientId && ACTIVE_APPT.includes(a.status) && new Date(a.startAt).getTime() > clock.nowMs()).map((a) => a.appointmentId) : [];
  }
  if (u.role === 'CLINIC_ADMIN') {
    for (const link of db.clinic_admins.filter((a) => a.userId === u.userId && a.status === 'ACTIVE')) {
      const others = db.clinic_admins.filter((a) => a.clinicId === link.clinicId && a.status === 'ACTIVE' && a.userId !== u.userId && db.users.find((x) => x.userId === a.userId)?.status === 'VERIFIED');
      if (!others.length) out.soleAdminOf.push(db.clinics.find((c) => c.clinicId === link.clinicId)!.name);
    }
  }
  return out;
}

export function userDetail(actor: Actor, userId: string): AdminUserDetailDto {
  const u = loadUser(actor, userId);
  const r = risks(u);
  const self = u.userId === actor.userId;
  const actions: AdminUserDetailDto['allowedActions'] = [];
  if (!self && u.status !== 'DELETED') {
    if (u.status === 'BLOCKED' || u.status === 'SUSPENDED') actions.push('UNBLOCK');
    else actions.push('BLOCK');
    actions.push('REVOKE_SESSIONS');
    if (u.role !== 'SUPER_ADMIN') actions.push('ANONYMIZE');
  }
  const warnings: string[] = [];
  if (self) warnings.push('Bu sizin hesabınızdır — öz hesabınızı bloklaya və silə bilməzsiniz.');
  if (r.futureAppointments.length) warnings.push(`${r.futureAppointments.length} gələcək aktiv randevu var — bloklamadan əvvəl onlar idarə olunmalıdır.`);
  if (r.soleAdminOf.length) warnings.push(`Bu, ${r.soleAdminOf.join(', ')} klinikasının yeganə aktiv administratorudur.`);
  if (u.deletionRequestedAt && u.status !== 'DELETED') warnings.push(`İstifadəçi ${bakuDate(new Date(u.deletionRequestedAt))} tarixində hesabın silinməsini tələb edib.`);
  const actorName = (id: string | null) => {
    const x = id ? db.users.find((y) => y.userId === id) : null;
    return x ? `${fullName(x)} (${ROLE_LABEL[x.role]})` : 'Sistem';
  };
  audit(actor, { action: 'VIEW_USER_ACCOUNT', entityType: 'USER', entityId: u.userId });
  return {
    ...toRow(u),
    email: u.email, birthDate: u.birthDate, gender: u.gender, blockedReason: u.blockedReason, lockedUntil: u.lockedUntil, failedLoginAttempts: u.failedLoginAttempts,
    deletionRequestedAt: u.deletionRequestedAt,
    sessions: db.user_sessions
      .filter((s) => s.userId === u.userId && isSessionActive(s))
      .map((s) => ({ sessionId: s.sessionId, deviceInfo: s.deviceInfo, ipAddress: s.ipAddress, createdAt: s.createdAt, lastSeenAt: s.lastSeenAt, expiresAt: s.expiresAt })),
    stats: statsFor(u),
    // Audit tarixçəsi: yalnız əməliyyat adı, obyekt növü, səbəb — dəyərlər (tibbi məzmun ola bilər) göstərilmir.
    audit: db.audit_logs
      .filter((l) => (l.userId === u.userId || (l.entityType === 'USER' && l.entityId === u.userId)) && l.action !== 'VIEW_USER_ACCOUNT')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 40)
      .map((l) => ({ action: l.action, entityType: l.entityType, reason: l.reason, byUser: l.userId === u.userId, actorName: actorName(l.userId), createdAt: l.createdAt })),
    allowedActions: actions,
    warnings,
  };
}

/** Alt 2/3: blokla və blokdan çıxar. BR-902-07 öz hesabı, BR-902-06 aktiv randevu, EF-902-2 yeganə admin. */
export function setUserStatus(actor: Actor, userId: string, input: { status: 'BLOCKED' | 'VERIFIED'; reason: string; conflictResolution?: 'CANCEL_AND_NOTIFY'; confirm?: boolean }): AdminUserDetailDto {
  const u = loadUser(actor, userId);
  if (u.userId === actor.userId) throw new ApiError('CannotModifySelf'); // EF-902-4
  if (u.status === 'DELETED') throw new ApiError('InvalidStatusTransition');
  const old = u.status;
  if (input.status === 'BLOCKED') {
    if (u.status === 'BLOCKED') throw new ApiError('InvalidStatusTransition');
    const r = risks(u);
    if (u.role === 'DOCTOR' && r.futureAppointments.length && !input.conflictResolution)
      throw new ApiError('HasActiveAppointments', { count: r.futureAppointments.length }, `Həkimin ${r.futureAppointments.length} aktiv randevusu var — ləğv edib pasientləri xəbərdar etməyi seçin`); // EF-902-1
    if (r.soleAdminOf.length && !input.confirm) throw new ApiError('Conflict', { soleAdmin: r.soleAdminOf }, `Bu klinikanın başqa administratoru yoxdur: ${r.soleAdminOf.join(', ')}`); // EF-902-2
    if (u.role === 'DOCTOR') for (const id of r.futureAppointments) cancelAppointment(actor, id, 'Həkimin hesabı platforma tərəfindən dayandırıldı');
    Object.assign(u, { status: 'BLOCKED', blockedReason: input.reason, updatedAt: clock.nowIso() });
    revokeUserSessions(u.userId); // BR-902-08
    revokeDeviceTokens(u.userId);
    notify({ type: 'ACCOUNT_STATUS_CHANGED', userId: u.userId, vars: { status: 'bloklanıb' } });
  } else {
    if (u.status !== 'BLOCKED' && u.status !== 'SUSPENDED') throw new ApiError('InvalidStatusTransition');
    Object.assign(u, { status: 'VERIFIED', blockedReason: null, failedLoginAttempts: 0, lockedUntil: null, updatedAt: clock.nowIso() });
    notify({ type: 'ACCOUNT_STATUS_CHANGED', userId: u.userId, vars: { status: 'yenidən aktivdir' } });
  }
  audit(actor, { action: input.status === 'BLOCKED' ? 'BLOCK_USER' : 'UNBLOCK_USER', entityType: 'USER', entityId: u.userId, oldValue: { status: old }, newValue: { status: u.status }, reason: input.reason });
  return userDetail(actor, userId);
}

/** Alt 5: şübhəli fəaliyyətdə bütün sessiyaların məcburi bağlanması. */
export function revokeSessions(actor: Actor, userId: string, reason: string): AdminUserDetailDto {
  const u = loadUser(actor, userId);
  if (u.userId === actor.userId) throw new ApiError('CannotModifySelf');
  const n = db.user_sessions.filter((s) => s.userId === u.userId && isSessionActive(s)).length;
  revokeUserSessions(u.userId);
  revokeDeviceTokens(u.userId);
  audit(actor, { action: 'REVOKE_USER_SESSIONS', entityType: 'USER', entityId: u.userId, newValue: { sessions: n }, reason });
  return userDetail(actor, userId);
}

/**
 * Alt 4: hesabın silinməsi = anonimləşdirmə (F11). Şəxsi identifikatorlar silinir, tibbi qeydlər qanunvericiliyə uyğun
 * saxlanılır (BR-902-05) — pasient/həkim qeydləri anonim istifadəçiyə bağlı qalır.
 */
export function anonymizeUser(actor: Actor, userId: string, input: { reason: string; conflictResolution?: 'CANCEL_AND_NOTIFY' }) {
  const u = loadUser(actor, userId);
  if (u.userId === actor.userId) throw new ApiError('CannotModifySelf'); // BR-902-07
  if (u.role === 'SUPER_ADMIN' || u.status === 'DELETED') throw new ApiError('InvalidStatusTransition');
  if (u.role === 'DOCTOR') {
    const d = db.doctors.find((x) => x.userId === u.userId);
    if (d && db.doctor_clinics.some((x) => x.doctorId === d.doctorId && (x.status === 'ACTIVE' || x.status === 'INACTIVE')))
      throw new ApiError('BusinessRuleViolation', undefined, 'Həkim əvvəlcə bütün klinikalardan çıxarılmalıdır (klinika admini vasitəsilə)'); // EF-902-5
  }
  if (u.role === 'CLINIC_ADMIN' && risks(u).soleAdminOf.length) throw new ApiError('Conflict', undefined, 'Yeganə klinika administratorunu silməzdən əvvəl yeni admin təyin edin');
  const future = risks(u).futureAppointments;
  if (future.length && !input.conflictResolution) throw new ApiError('HasActiveAppointments', { count: future.length }, `${future.length} aktiv randevu var — ləğv edilməlidir`);
  for (const id of future) cancelAppointment(actor, id, 'Hesab silindi');
  Object.assign(u, {
    firstName: 'Silinmiş', lastName: 'istifadəçi', fatherName: null, fin: `D${randomDigits(6)}`, mobileNumber: `+99400${randomDigits(7)}`, email: null, photoUrl: null,
    pinHash: '', biometricEnabled: false, status: 'DELETED', deletedAt: clock.nowIso(), updatedAt: clock.nowIso(),
  });
  for (const a of db.clinic_admins.filter((x) => x.userId === u.userId)) a.status = 'REMOVED';
  revokeUserSessions(u.userId);
  revokeDeviceTokens(u.userId);
  // Audit dəyişdirilmir (BR-904-04) — ona görə ora şəxsi məlumat yazılmır, yalnız rol.
  audit(actor, { action: 'ANONYMIZE_USER', entityType: 'USER', entityId: u.userId, oldValue: { role: u.role }, reason: input.reason });
  return userDetail(actor, userId);
}
