import {
  acceptingSchema,
  bulkCancelSchema,
  clinicAppointmentsQuerySchema,
  clinicDoctorUpdateSchema,
  clinicProfileUpdateSchema,
  clinicServiceCreateSchema,
  clinicServiceUpdateSchema,
  closeDaySchema,
  doctorInviteSchema,
  doctorLookupSchema,
  doctorRemoveSchema,
  exceptionCreateSchema,
  holidayCreateSchema,
  inviteAcceptSchema,
  photoCreateSchema,
  photoOrderSchema,
  REPORT_TYPES,
  reportQuerySchema,
  scheduleQuerySchema,
  schedulePutSchema,
  serviceRequestSchema,
  workingHoursSchema,
  type ReportType,
} from '@mediconnect/shared';
import { Router, type Request } from 'express';
import { z } from 'zod';
import { actorOf } from '../core/actor';
import { requireRole } from '../core/auth';
import { ApiError } from '../core/errors';
import { created, ok } from '../core/respond';
import { parseBody, parseQuery } from '../core/validate';
import * as adminInvites from '../services/admin-clinics.service';
import * as admin from '../services/clinic-admin.service';
import * as doctors from '../services/clinic-doctors.service';
import * as oversight from '../services/clinic-oversight.service';
import * as services from '../services/clinic-services.service';
import * as schedule from '../services/schedule-edit.service';

// Modul 8 — UC-801..805. Router /clinic-admin prefiksinə qoşulur, ona görə router səviyyəsində rol yoxlaması təhlükəsizdir.
// Klinika həmişə actor-dan müəyyən olunur (BR-800-02); URL-də clinicId yoxdur.
export const clinicAdminRouter = Router();
clinicAdminRouter.use(requireRole('CLINIC_ADMIN'));

const id = (v: string | string[] | undefined) => String(v);
/** Dəvət linki üçün client-in ünvanı (Vite portu dəyişə bilər). */
const originOf = (req: Request) => req.get('origin') ?? `${req.protocol}://${req.get('host')?.replace(':4000', ':5173')}`;
const clinicIdOf = (req: Request) => admin.adminClinic(actorOf(req)).clinicId;

clinicAdminRouter.get('/dashboard', (req, res) => ok(req, res, admin.clinicDashboard(actorOf(req))));

// ── UC-801 ──
clinicAdminRouter.get('/profile', (req, res) => ok(req, res, admin.getClinicProfile(actorOf(req))));
clinicAdminRouter.patch('/profile', (req, res) => {
  admin.rejectLockedClinicFields(req.body);
  ok(req, res, admin.updateClinicProfile(actorOf(req), parseBody(req, clinicProfileUpdateSchema)), { message: 'saved' });
});
clinicAdminRouter.put('/working-hours', (req, res) => ok(req, res, admin.saveWorkingHours(actorOf(req), parseBody(req, workingHoursSchema))));
clinicAdminRouter.post('/holidays', (req, res) => created(req, res, admin.addHoliday(actorOf(req), parseBody(req, holidayCreateSchema))));
clinicAdminRouter.delete('/holidays/:id', (req, res) => ok(req, res, admin.removeHoliday(actorOf(req), id(req.params.id))));
clinicAdminRouter.patch('/accepting', (req, res) => {
  const b = parseBody(req, acceptingSchema);
  ok(req, res, admin.setAccepting(actorOf(req), b.acceptingAppointments, b.reason));
});
clinicAdminRouter.post('/photos', (req, res) => created(req, res, admin.addPhoto(actorOf(req), parseBody(req, photoCreateSchema).photo)));
clinicAdminRouter.patch('/photos/order', (req, res) => ok(req, res, admin.reorderPhotos(actorOf(req), parseBody(req, photoOrderSchema).photoIds)));
clinicAdminRouter.delete('/photos/:id', (req, res) => ok(req, res, admin.removePhoto(actorOf(req), id(req.params.id))));

// ── UC-802 ──
clinicAdminRouter.get('/doctors', (req, res) => ok(req, res, doctors.listClinicDoctors(actorOf(req), parseQuery(req, z.object({ status: z.string().optional(), q: z.string().optional() })))));
clinicAdminRouter.post('/doctors/lookup', (req, res) => ok(req, res, doctors.lookupDoctor(actorOf(req), parseBody(req, doctorLookupSchema).fin)));
clinicAdminRouter.post('/doctors', (req, res) => created(req, res, doctors.inviteDoctor(actorOf(req), parseBody(req, doctorInviteSchema), originOf(req))));
clinicAdminRouter.get('/doctors/:id', (req, res) => ok(req, res, doctors.clinicDoctorDetail(actorOf(req), id(req.params.id))));
clinicAdminRouter.patch('/doctors/:id', (req, res) => ok(req, res, doctors.updateClinicDoctor(actorOf(req), id(req.params.id), parseBody(req, clinicDoctorUpdateSchema)), { message: 'saved' }));
clinicAdminRouter.post('/doctors/:id/resend-invite', (req, res) => ok(req, res, doctors.resendInvite(actorOf(req), id(req.params.id), originOf(req))));
clinicAdminRouter.delete('/doctors/:id', (req, res) => ok(req, res, doctors.removeClinicDoctor(actorOf(req), id(req.params.id), parseBody(req, doctorRemoveSchema))));

// ── UC-803: həkim cədvəli (həkim paneli ilə eyni servis, admin klinikası ilə məhdud) ──
const adminDc = (req: Request) => schedule.resolveDoctorClinic(actorOf(req), clinicIdOf(req), id(req.params.id));
clinicAdminRouter.get('/doctors/:id/schedule', (req, res) => {
  const q = parseQuery(req, scheduleQuerySchema.omit({ clinicId: true }));
  ok(req, res, schedule.getSchedule(actorOf(req), adminDc(req), q.from, q.days));
});
clinicAdminRouter.put('/doctors/:id/schedule', (req, res) => ok(req, res, schedule.saveSchedule(actorOf(req), adminDc(req), parseBody(req, schedulePutSchema.omit({ clinicId: true })))));
clinicAdminRouter.post('/doctors/:id/schedule/exceptions', (req, res) => created(req, res, schedule.addException(actorOf(req), adminDc(req), parseBody(req, exceptionCreateSchema.omit({ clinicId: true })))));
clinicAdminRouter.delete('/doctors/:id/schedule/exceptions/:exceptionId', (req, res) => {
  schedule.removeException(actorOf(req), adminDc(req), id(req.params.exceptionId));
  ok(req, res, null);
});
clinicAdminRouter.get('/doctors/:id/close-day', (req, res) => ok(req, res, doctors.closeDayPreview(actorOf(req), id(req.params.id), parseQuery(req, z.object({ date: z.string() })).date)));
clinicAdminRouter.post('/doctors/:id/close-day', (req, res) => ok(req, res, doctors.closeDay(actorOf(req), id(req.params.id), parseBody(req, closeDaySchema))));

// ── UC-804 ──
clinicAdminRouter.get('/services', (req, res) => ok(req, res, services.listClinicServices(actorOf(req))));
clinicAdminRouter.post('/services', (req, res) => created(req, res, services.addClinicService(actorOf(req), parseBody(req, clinicServiceCreateSchema))));
clinicAdminRouter.patch('/services/:id', (req, res) => ok(req, res, services.updateClinicService(actorOf(req), id(req.params.id), parseBody(req, clinicServiceUpdateSchema))));
clinicAdminRouter.delete('/services/:id', (req, res) => ok(req, res, services.removeClinicService(actorOf(req), id(req.params.id))));
clinicAdminRouter.post('/service-requests', (req, res) => created(req, res, services.requestService(actorOf(req), parseBody(req, serviceRequestSchema))));

// ── UC-805 ──
clinicAdminRouter.get('/appointments', (req, res) => ok(req, res, oversight.listClinicAppointments(actorOf(req), parseQuery(req, clinicAppointmentsQuerySchema))));
clinicAdminRouter.post('/appointments/bulk-cancel', (req, res) => ok(req, res, oversight.bulkCancel(actorOf(req), parseBody(req, bulkCancelSchema))));

const reportType = (v: string | string[] | undefined): ReportType => {
  const t = String(v);
  if (!(REPORT_TYPES as readonly string[]).includes(t)) throw new ApiError('NotFound');
  return t as ReportType;
};
clinicAdminRouter.get('/reports/:type', (req, res) => {
  const q = parseQuery(req, reportQuerySchema);
  ok(req, res, oversight.clinicReport(actorOf(req), reportType(req.params.type), q.from, q.to));
});
clinicAdminRouter.get('/reports/:type/export', (req, res) => {
  const q = parseQuery(req, reportQuerySchema.extend({ format: z.enum(['csv', 'pdf']).default('csv') }));
  const file = oversight.exportReport(actorOf(req), reportType(req.params.type), q.from, q.to, q.format);
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
  res.send(file.body);
});

// ── Dəvətin qəbulu (/v1/invites/{token}) — autentifikasiyasız, token özü icazədir ──
export const invitesRouter = Router();
const deviceInfo = (req: Request) => req.get('user-agent')?.slice(0, 120) ?? null;
// Token həm həkim dəvəti (UC-802), həm klinika admini dəvəti (UC-901) ola bilər.
invitesRouter.get('/:token', (req, res) => {
  const inv = adminInvites.findAdminInvite(id(req.params.token));
  ok(req, res, inv ? adminInvites.adminInviteInfo(inv) : doctors.inviteInfo(id(req.params.token)));
});
invitesRouter.post('/:token/sima', (req, res) => {
  const inv = adminInvites.findAdminInvite(id(req.params.token));
  created(req, res, inv ? adminInvites.startAdminInviteSima(inv) : doctors.startInviteSima(id(req.params.token)));
});
invitesRouter.post('/:token/accept', (req, res) => {
  const inv = adminInvites.findAdminInvite(id(req.params.token));
  const body = parseBody(req, inviteAcceptSchema);
  ok(req, res, inv ? adminInvites.acceptAdminInvite(actorOf(req), inv, body, deviceInfo(req)) : doctors.acceptInvite(actorOf(req), id(req.params.token), body, deviceInfo(req)));
});
invitesRouter.post('/:token/decline', (req, res) => {
  const inv = adminInvites.findAdminInvite(id(req.params.token));
  ok(req, res, inv ? adminInvites.declineAdminInvite(actorOf(req), inv) : doctors.declineInvite(actorOf(req), id(req.params.token)));
});
