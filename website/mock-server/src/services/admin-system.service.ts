import type {
  AdminDrugDto,
  AdminInteractionDto,
  AdminServiceRequestDto,
  AdminSettingDto,
  AdminTemplateDto,
  AuditPageDto,
  AuditRowDto,
  CatalogRowDto,
  PlatformStatsDto,
  SecurityPageDto,
  SettingKey,
} from '@mediconnect/shared';
import { ROLE_LABEL, SETTINGS } from '@mediconnect/shared';
import type { Actor } from '../core/actor';
import { audit, securityEvent } from '../core/audit';
import { addDays, addDaysToDate, bakuDate, clock } from '../core/clock';
import { ApiError } from '../core/errors';
import { setSetting } from '../core/settings';
import { faults } from '../integrations/faults';
import { db } from '../store/db';
import { newId, paginate } from '../store/repo';
import { TEMPLATES } from '../store/seed-data/templates';
import type { User } from '../store/types';
import { notify } from './notifications.service';
import { isDoctorVisible } from './visibility';

// UC-904 — sistem parametrləri, mərkəzi kataloqlar, audit, təhlükəsizlik hadisələri, platforma statistikası.
// Audit log yalnız oxunur (BR-904-04): bu modulda audit_logs üzərində update/delete yoxdur.

function assertSuperAdmin(actor: Actor) {
  if (actor.role !== 'SUPER_ADMIN') throw new ApiError('Forbidden');
}
const nameOf = (u: User | undefined) => (u ? `${u.firstName} ${u.lastName}` : null);
const userById = (id: string | null) => (id ? db.users.find((u) => u.userId === id) : undefined);

// ── Parametrlər (FR-904-A) ──

export function listSettings(actor: Actor): AdminSettingDto[] {
  assertSuperAdmin(actor);
  return db.system_settings
    .filter((r) => r.settingKey in SETTINGS)
    .map((r) => {
      const def = SETTINGS[r.settingKey as SettingKey];
      return {
        key: r.settingKey, value: Number(r.settingValue), defaultValue: def.value, category: def.category, description: def.description, min: def.min, max: def.max,
        isCritical: r.isCritical, updatedAt: r.updatedAt, updatedBy: nameOf(userById(r.updatedBy)),
      };
    });
}

/** EF-904-1 diapazon, EF-904-2 kritik təsdiq, BR-904-03 audit — core/settings.setSetting-də. Dəyişiklik dərhal tətbiq olunur. */
export function updateSetting(actor: Actor, key: string, input: { value: number; confirm?: boolean; reason?: string }) {
  assertSuperAdmin(actor);
  if (!(key in SETTINGS)) throw new ApiError('NotFound');
  const row = db.system_settings.find((s) => s.settingKey === key);
  if (row?.isCritical && !input.reason?.trim()) throw new ApiError('ReasonRequired');
  setSetting(actor, key as SettingKey, input.value, { confirm: input.confirm, reason: input.reason ?? null });
  return listSettings(actor);
}

export function settingHistory(actor: Actor, key: string) {
  assertSuperAdmin(actor);
  const row = db.system_settings.find((s) => s.settingKey === key);
  if (!row) throw new ApiError('NotFound');
  return db.audit_logs
    .filter((l) => l.action === 'UPDATE_SETTING' && l.entityId === row.settingId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((l) => ({ from: (l.oldValue as Record<string, string>)?.[key] ?? null, to: (l.newValue as Record<string, number>)?.[key] ?? null, by: nameOf(userById(l.userId)), reason: l.reason, at: l.createdAt }));
}

// ── Kataloqlar (FR-904-B) ──

function specialtyUsage(id: string) {
  const doctors = db.doctor_specialties.filter((x) => x.specialtyId === id).map((x) => x.doctorId);
  const clinics = new Set(db.doctor_clinics.filter((x) => doctors.includes(x.doctorId) && x.status !== 'REMOVED').map((x) => db.clinics.find((c) => c.clinicId === x.clinicId)!.name));
  return { usage: doctors.length, usageDetail: [...clinics] };
}

export function listSpecialties(actor: Actor): CatalogRowDto[] {
  assertSuperAdmin(actor);
  return db.specialties
    .map((s) => ({ id: s.specialtyId, nameAz: s.nameAz, nameRu: s.nameRu, nameEn: s.nameEn, isActive: s.isActive, ...specialtyUsage(s.specialtyId) }))
    .sort((a, b) => a.nameAz.localeCompare(b.nameAz, 'az'));
}

export function upsertSpecialty(actor: Actor, id: string | null, input: { nameAz: string; nameRu?: string | null; nameEn?: string | null; isActive?: boolean }) {
  assertSuperAdmin(actor);
  const dup = db.specialties.find((s) => s.nameAz.toLocaleLowerCase('az') === input.nameAz.toLocaleLowerCase('az') && s.specialtyId !== id);
  if (dup) throw new ApiError('Conflict', undefined, 'Bu adda ixtisas artıq var');
  if (id) {
    const s = db.specialties.find((x) => x.specialtyId === id);
    if (!s) throw new ApiError('NotFound');
    const old = { ...s };
    Object.assign(s, { nameAz: input.nameAz, nameRu: input.nameRu ?? s.nameRu, nameEn: input.nameEn ?? s.nameEn, isActive: input.isActive ?? s.isActive });
    audit(actor, { action: 'UPDATE_SPECIALTY', entityType: 'SPECIALTY', entityId: id, oldValue: old, newValue: s });
  } else {
    const s = { specialtyId: newId(), nameAz: input.nameAz, nameRu: input.nameRu ?? null, nameEn: input.nameEn ?? null, isActive: input.isActive ?? true, createdAt: clock.nowIso() };
    db.specialties.push(s);
    audit(actor, { action: 'CREATE_SPECIALTY', entityType: 'SPECIALTY', entityId: s.specialtyId, newValue: s });
  }
  return listSpecialties(actor);
}

/** EF-904-3 / BR-904-06: istifadə olunan element silinmir — hansı klinikaların istifadə etdiyi göstərilir. */
export function deleteSpecialty(actor: Actor, id: string) {
  assertSuperAdmin(actor);
  const s = db.specialties.find((x) => x.specialtyId === id);
  if (!s) throw new ApiError('NotFound');
  const u = specialtyUsage(id);
  if (u.usage) throw new ApiError('Conflict', { usage: u.usageDetail }, `İxtisas ${u.usage} həkimdə istifadə olunur (${u.usageDetail.join(', ') || '—'}) — silmək əvəzinə deaktiv edin`);
  db.specialties = db.specialties.filter((x) => x !== s);
  audit(actor, { action: 'DELETE_SPECIALTY', entityType: 'SPECIALTY', entityId: id, oldValue: s });
  return listSpecialties(actor);
}

function serviceUsage(id: string) {
  const dcIds = db.clinic_doctor_services.filter((x) => x.serviceId === id).map((x) => x.doctorClinicId);
  const clinics = new Set(db.doctor_clinics.filter((x) => dcIds.includes(x.doctorClinicId)).map((x) => db.clinics.find((c) => c.clinicId === x.clinicId)!.name));
  const appts = db.appointments.filter((a) => a.serviceId === id).length;
  return { usage: clinics.size + appts, usageDetail: [...clinics] };
}

export function listCatalogServices(actor: Actor): CatalogRowDto[] {
  assertSuperAdmin(actor);
  return db.services
    .map((s) => ({ id: s.serviceId, nameAz: s.nameAz, nameRu: s.nameRu, nameEn: s.nameEn, category: s.category, isActive: s.isActive, ...serviceUsage(s.serviceId) }))
    .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '') || a.nameAz.localeCompare(b.nameAz, 'az'));
}

export function upsertCatalogService(actor: Actor, id: string | null, input: { nameAz: string; nameRu?: string | null; nameEn?: string | null; category?: string | null; isActive?: boolean }) {
  assertSuperAdmin(actor);
  const dup = db.services.find((s) => s.nameAz.toLocaleLowerCase('az') === input.nameAz.toLocaleLowerCase('az') && s.serviceId !== id);
  if (dup) throw new ApiError('Conflict', undefined, 'Bu adda xidmət artıq kataloqdadır');
  if (id) {
    const s = db.services.find((x) => x.serviceId === id);
    if (!s) throw new ApiError('NotFound');
    const old = { ...s };
    Object.assign(s, { nameAz: input.nameAz, nameRu: input.nameRu ?? s.nameRu, nameEn: input.nameEn ?? s.nameEn, category: input.category ?? s.category, isActive: input.isActive ?? s.isActive });
    audit(actor, { action: 'UPDATE_CATALOG_SERVICE', entityType: 'SERVICE', entityId: id, oldValue: old, newValue: s });
    return listCatalogServices(actor);
  }
  const s = { serviceId: newId(), nameAz: input.nameAz, nameRu: input.nameRu ?? null, nameEn: input.nameEn ?? null, category: input.category ?? null, isActive: input.isActive ?? true, createdAt: clock.nowIso() };
  db.services.push(s);
  audit(actor, { action: 'CREATE_CATALOG_SERVICE', entityType: 'SERVICE', entityId: s.serviceId, newValue: s });
  return listCatalogServices(actor);
}

export function deleteCatalogService(actor: Actor, id: string) {
  assertSuperAdmin(actor);
  const s = db.services.find((x) => x.serviceId === id);
  if (!s) throw new ApiError('NotFound');
  const u = serviceUsage(id);
  if (u.usage) throw new ApiError('Conflict', { usage: u.usageDetail }, `Xidmət istifadə olunur (${u.usageDetail.join(', ') || 'keçmiş randevular'}) — silmək əvəzinə deaktiv edin`); // EF-904-3
  db.services = db.services.filter((x) => x !== s);
  audit(actor, { action: 'DELETE_CATALOG_SERVICE', entityType: 'SERVICE', entityId: id, oldValue: s });
  return listCatalogServices(actor);
}

export function listServiceRequests(actor: Actor): AdminServiceRequestDto[] {
  assertSuperAdmin(actor);
  return db.service_requests
    .sort((a, b) => Number(b.status === 'PENDING') - Number(a.status === 'PENDING') || b.createdAt.localeCompare(a.createdAt))
    .map((r) => ({ requestId: r.requestId, clinicName: db.clinics.find((c) => c.clinicId === r.clinicId)?.name ?? '', name: r.name, category: r.category, note: r.note, status: r.status, createdAt: r.createdAt }));
}

/** UC-804 alt 4-ün davamı: tələb təsdiqlənəndə xidmət kataloqa əlavə olunur. */
export function resolveServiceRequest(actor: Actor, requestId: string, input: { decision: 'APPROVE' | 'REJECT'; reason?: string }) {
  assertSuperAdmin(actor);
  const r = db.service_requests.find((x) => x.requestId === requestId);
  if (!r) throw new ApiError('NotFound');
  if (r.status !== 'PENDING') throw new ApiError('InvalidStatusTransition');
  if (input.decision === 'APPROVE' && !db.services.some((s) => s.nameAz.toLocaleLowerCase('az') === r.name.toLocaleLowerCase('az')))
    upsertCatalogService(actor, null, { nameAz: r.name, category: r.category });
  Object.assign(r, { status: input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', resolvedAt: clock.nowIso() });
  audit(actor, { action: `${input.decision}_SERVICE_REQUEST`, entityType: 'SERVICE_REQUEST', entityId: requestId, reason: input.reason ?? null });
  for (const a of db.clinic_admins.filter((x) => x.clinicId === r.clinicId && x.status === 'ACTIVE'))
    notify({ type: 'CLINIC_STATUS_CHANGED', userId: a.userId, deepLink: '/clinic-admin/services', vars: { clinicName: r.name, status: input.decision === 'APPROVE' ? 'xidmət kataloqa əlavə edildi' : 'xidmət tələbi rədd edildi', reason: input.reason ?? '' } });
  return listServiceRequests(actor);
}

// ── Dərman kataloqu və qarşılıqlı təsirlər (alt 3) ──

const drugUsage = (id: string) => db.prescription_medications.filter((m) => m.drugId === id).length;

export function listDrugs(actor: Actor, query = ''): AdminDrugDto[] {
  assertSuperAdmin(actor);
  const q = query.trim().toLocaleLowerCase('az');
  return db.drugs
    .filter((d) => !q || d.tradeName.toLocaleLowerCase('az').includes(q) || (d.genericName ?? '').toLocaleLowerCase('az').includes(q))
    .map((d) => ({ drugId: d.drugId, tradeName: d.tradeName, genericName: d.genericName, drugClass: d.drugClass, form: d.form, strength: d.strength, isControlled: d.isControlled, isActive: d.isActive, patientInfo: d.patientInfo, usage: drugUsage(d.drugId) }))
    .sort((a, b) => a.tradeName.localeCompare(b.tradeName, 'az'));
}

export function upsertDrug(
  actor: Actor,
  id: string | null,
  input: { tradeName: string; genericName?: string | null; drugClass?: string | null; form?: string | null; strength?: string | null; isControlled?: boolean; isActive?: boolean; patientInfo?: string | null },
) {
  assertSuperAdmin(actor);
  const dup = db.drugs.find((d) => d.tradeName.toLocaleLowerCase('az') === input.tradeName.toLocaleLowerCase('az') && (d.strength ?? '') === (input.strength ?? '') && d.drugId !== id);
  if (dup) throw new ApiError('Conflict', undefined, 'Bu ad və dozada dərman artıq kataloqdadır');
  if (id) {
    const d = db.drugs.find((x) => x.drugId === id);
    if (!d) throw new ApiError('NotFound');
    const old = { ...d };
    Object.assign(d, Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)));
    audit(actor, { action: old.isControlled !== d.isControlled ? 'SET_DRUG_CONTROLLED' : 'UPDATE_DRUG', entityType: 'DRUG', entityId: id, oldValue: old, newValue: d });
  } else {
    const d = {
      drugId: newId(), tradeName: input.tradeName, genericName: input.genericName ?? null, drugClass: input.drugClass ?? null, patientInfo: input.patientInfo ?? null,
      form: input.form ?? null, strength: input.strength ?? null, isControlled: input.isControlled ?? false, isActive: input.isActive ?? true, createdAt: clock.nowIso(),
    };
    db.drugs.push(d);
    audit(actor, { action: 'CREATE_DRUG', entityType: 'DRUG', entityId: d.drugId, newValue: d });
  }
  return listDrugs(actor);
}

export function listInteractions(actor: Actor): AdminInteractionDto[] {
  assertSuperAdmin(actor);
  const name = (id: string) => db.drugs.find((d) => d.drugId === id)?.tradeName ?? '—';
  const order = { SEVERE: 0, MODERATE: 1, MINOR: 2 } as const;
  return db.drug_interactions
    .map((i) => ({ interactionId: i.interactionId, drugId1: i.drugId1, drugId2: i.drugId2, drug1: name(i.drugId1), drug2: name(i.drugId2), severity: i.severity, description: i.description }))
    .sort((a, b) => order[a.severity] - order[b.severity] || a.drug1.localeCompare(b.drug1, 'az'));
}

export function addInteraction(actor: Actor, input: { drugId1: string; drugId2: string; severity: 'MINOR' | 'MODERATE' | 'SEVERE'; description: string }) {
  assertSuperAdmin(actor);
  if (input.drugId1 === input.drugId2) throw new ApiError('ValidationError', { fields: { drugId2: 'İki fərqli dərman seçin' } });
  if (![input.drugId1, input.drugId2].every((id) => db.drugs.some((d) => d.drugId === id))) throw new ApiError('NotFound');
  // UNIQUE(drug_id_1, drug_id_2) — cüt sıralanmış saxlanılır.
  const [a, b] = [input.drugId1, input.drugId2].sort();
  if (db.drug_interactions.some((i) => [i.drugId1, i.drugId2].sort().join() === [a, b].join())) throw new ApiError('Conflict', undefined, 'Bu cüt üçün qarşılıqlı təsir artıq qeyd olunub');
  const row = { interactionId: newId(), drugId1: a, drugId2: b, severity: input.severity, description: input.description, createdAt: clock.nowIso() };
  db.drug_interactions.push(row);
  audit(actor, { action: 'CREATE_DRUG_INTERACTION', entityType: 'DRUG_INTERACTION', entityId: row.interactionId, newValue: row });
  return listInteractions(actor);
}

export function deleteInteraction(actor: Actor, id: string) {
  assertSuperAdmin(actor);
  const row = db.drug_interactions.find((i) => i.interactionId === id);
  if (!row) throw new ApiError('NotFound');
  db.drug_interactions = db.drug_interactions.filter((i) => i !== row);
  audit(actor, { action: 'DELETE_DRUG_INTERACTION', entityType: 'DRUG_INTERACTION', entityId: id, oldValue: row });
  return listInteractions(actor);
}

// ── Bildiriş şablonları (alt 4, BR-904-07) ──

export function listTemplates(actor: Actor): AdminTemplateDto[] {
  assertSuperAdmin(actor);
  return db.notification_templates
    .map((t) => ({ templateId: t.templateId, notificationType: t.notificationType, languageCode: t.languageCode, channel: t.channel, titleTemplate: t.titleTemplate, bodyTemplate: t.bodyTemplate, isActive: t.isActive, updatedAt: t.updatedAt }))
    .sort((a, b) => a.notificationType.localeCompare(b.notificationType) || a.languageCode.localeCompare(b.languageCode) || a.channel.localeCompare(b.channel));
}

const vars = (s: string | null | undefined) => new Set([...(s ?? '').matchAll(/\{(\w+)\}/g)].map((m) => m[1]));

/** Yalnız standart şablonda olan dəyişənlərə icazə var — tibbi məlumat (diaqnoz, dərman) bildirişə düşə bilməz (BR-1001). */
export function updateTemplate(actor: Actor, templateId: string, input: { titleTemplate: string | null; bodyTemplate: string; isActive?: boolean }) {
  assertSuperAdmin(actor);
  const t = db.notification_templates.find((x) => x.templateId === templateId);
  if (!t) throw new ApiError('NotFound');
  const base = TEMPLATES[t.notificationType];
  const allowed = new Set(Object.values(base).flatMap((x) => [...vars(x.title), ...vars(x.body)]));
  const unknown = [...vars(input.bodyTemplate), ...vars(input.titleTemplate)].filter((v) => !allowed.has(v));
  if (unknown.length) throw new ApiError('ValidationError', { fields: { bodyTemplate: `Naməlum dəyişən: {${unknown.join('}, {')}}. İcazəli: {${[...allowed].join('}, {')}}` } });
  const old = { titleTemplate: t.titleTemplate, bodyTemplate: t.bodyTemplate, isActive: t.isActive };
  Object.assign(t, { titleTemplate: input.titleTemplate, bodyTemplate: input.bodyTemplate, isActive: input.isActive ?? t.isActive, updatedAt: clock.nowIso() });
  audit(actor, { action: 'UPDATE_NOTIFICATION_TEMPLATE', entityType: 'NOTIFICATION_TEMPLATE', entityId: templateId, oldValue: old, newValue: input });
  return listTemplates(actor);
}

// ── Audit (alt 5, BR-904-04) ──

/** Audit sətrində dəyərlər göstərilmir — yalnız dəyişən sahələrin adları (dəyər tibbi məzmun daşıya bilər). */
function changedFields(oldV: unknown, newV: unknown): string[] {
  const keys = new Set<string>();
  for (const v of [oldV, newV]) if (v && typeof v === 'object' && !Array.isArray(v)) Object.keys(v).forEach((k) => keys.add(k));
  return [...keys].slice(0, 12);
}

function filteredAudit(q: { userId?: string; action?: string; entityType?: string; from?: string; to?: string }) {
  const act = q.action?.toUpperCase();
  return db.audit_logs
    .filter(
      (l) =>
        (!q.userId || l.userId === q.userId) &&
        (!act || l.action.includes(act)) &&
        (!q.entityType || l.entityType === q.entityType) &&
        (!q.from || bakuDate(new Date(l.createdAt)) >= q.from) &&
        (!q.to || bakuDate(new Date(l.createdAt)) <= q.to),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const toAuditRow = (l: (typeof db.audit_logs)[number]): AuditRowDto => ({
  auditId: l.auditId, createdAt: l.createdAt, actorName: nameOf(userById(l.userId)), actorRole: l.userRole, action: l.action, entityType: l.entityType,
  entityId: l.entityId, reason: l.reason, ipAddress: l.ipAddress, changedFields: changedFields(l.oldValue, l.newValue),
});

export function listAudit(actor: Actor, q: { userId?: string; action?: string; entityType?: string; from?: string; to?: string; page: number; size: number }): AuditPageDto {
  assertSuperAdmin(actor);
  const page = paginate(filteredAudit(q), q.page, q.size);
  return {
    totalCount: page.totalCount, page: page.page, size: page.size, rows: page.items.map(toAuditRow),
    actions: [...new Set(db.audit_logs.map((l) => l.action))].sort(), entityTypes: [...new Set(db.audit_logs.map((l) => l.entityType))].sort(),
  };
}

export function exportAudit(actor: Actor, q: { userId?: string; action?: string; entityType?: string; from?: string; to?: string }) {
  assertSuperAdmin(actor);
  const rows = filteredAudit(q).slice(0, 10_000).map(toAuditRow);
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ['Vaxt (UTC)', 'İstifadəçi', 'Rol', 'Əməliyyat', 'Obyekt', 'Obyekt ID', 'Səbəb', 'IP', 'Sahələr'];
  const csv = '﻿' + [head, ...rows.map((r) => [r.createdAt, r.actorName ?? 'Sistem', r.actorRole ? ROLE_LABEL[r.actorRole] : '', r.action, r.entityType, r.entityId, r.reason, r.ipAddress, r.changedFields.join(',')])].map((row) => row.map(esc).join(';')).join('\r\n');
  audit(actor, { action: 'EXPORT_AUDIT_LOG', entityType: 'AUDIT_LOG', newValue: { ...q, rows: rows.length } });
  return Buffer.from(csv, 'utf8');
}

// ── Təhlükəsizlik hadisələri (alt 7) ──

export function listSecurityEvents(actor: Actor, q: { eventType?: string; severity?: string; page: number; size: number }): SecurityPageDto {
  assertSuperAdmin(actor);
  const list = db.security_events.filter((e) => (!q.eventType || e.eventType === q.eventType) && (!q.severity || e.severity === q.severity)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const page = paginate(list, q.page, q.size);
  const since = addDays(clock.now(), -1).getTime();
  const last24h: Record<string, number> = {};
  for (const e of db.security_events.filter((x) => new Date(x.createdAt).getTime() >= since)) last24h[e.eventType] = (last24h[e.eventType] ?? 0) + 1;
  return {
    totalCount: page.totalCount, page: page.page, size: page.size, last24h,
    rows: page.items.map((e) => ({ eventId: e.eventId, createdAt: e.createdAt, eventType: e.eventType, severity: e.severity, description: e.description, userName: nameOf(userById(e.userId)), ipAddress: e.ipAddress })),
  };
}

// ── Platforma statistikası (alt 6) ──

export function platformStats(actor: Actor): PlatformStatsDto {
  assertSuperAdmin(actor);
  const now = clock.nowMs();
  const today = bakuDate();
  const d30 = addDays(clock.now(), -30).getTime();
  const live = db.users.filter((u) => u.status !== 'DELETED');
  const users = { PATIENT: 0, DOCTOR: 0, CLINIC_ADMIN: 0, SUPER_ADMIN: 0 };
  for (const u of live) users[u.role]++;
  const clinics = { PENDING_VERIFICATION: 0, ACTIVE: 0, SUSPENDED: 0, INACTIVE: 0 };
  for (const c of db.clinics) clinics[c.status]++;
  const startMs = (a: { startAt: string }) => new Date(a.startAt).getTime();
  const last30 = db.appointments.filter((a) => startMs(a) >= d30 && startMs(a) <= now);
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) days.push(addDaysToDate(today, -i));
  const daysLeft = (d: string) => Math.round((new Date(`${d}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000);
  return {
    users,
    activeUsers30d: live.filter((u) => u.lastLoginAt && new Date(u.lastLoginAt).getTime() >= d30).length,
    clinics,
    doctors: { visible: db.doctors.filter(isDoctorVisible).length, total: db.doctors.length },
    appointments: {
      today: db.appointments.filter((a) => bakuDate(new Date(a.startAt)) === today && a.status !== 'CANCELLED').length,
      last30d: last30.length,
      upcoming: db.appointments.filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status) && startMs(a) > now).length,
      completed30d: last30.filter((a) => a.status === 'COMPLETED').length,
      cancelled30d: last30.filter((a) => a.status === 'CANCELLED').length,
    },
    daily: days.map((date) => ({ date, count: db.appointments.filter((a) => bakuDate(new Date(a.createdAt)) === date).length })),
    pending: {
      clinicsToVerify: clinics.PENDING_VERIFICATION,
      deletionRequests: db.users.filter((u) => u.deletionRequestedAt && u.status !== 'DELETED').length,
      serviceRequests: db.service_requests.filter((r) => r.status === 'PENDING').length,
      reviewsToModerate: db.reviews.filter((r) => r.status === 'PENDING_MODERATION' || r.status === 'REPORTED').length,
    },
    security24h: db.security_events.filter((e) => new Date(e.createdAt).getTime() >= addDays(clock.now(), -1).getTime()).length,
    health: Object.entries(faults.all()).map(([name, status]) => ({ name, status })),
    licenseAlerts: db.clinics
      .filter((c) => c.status === 'ACTIVE' && daysLeft(c.licenseExpiryDate) <= 30)
      .map((c) => ({ clinicId: c.clinicId, name: c.name, licenseExpiryDate: c.licenseExpiryDate, daysLeft: daysLeft(c.licenseExpiryDate) })),
  };
}

/** EF-904-4: audit log-u dəyişdirmə cəhdi — rədd edilir və təhlükəsizlik reyestrinə yazılır. */
export function auditTamperAttempt(actor: Actor, method: string) {
  securityEvent(actor, 'ADMIN_ACTION', 'HIGH', `Audit jurnalını dəyişdirmə cəhdi (${method}) — rədd edildi`);
}
