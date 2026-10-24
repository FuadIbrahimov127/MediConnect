import {
  appointmentCreateSchema,
  appointmentListSchema,
  cancelSchema,
  completeSchema,
  rejectSchema,
  rescheduleRespondSchema,
  rescheduleSchema,
  slotLockSchema,
} from '@mediconnect/shared';
import { Router } from 'express';
import { actorOf } from '../core/actor';
import { requireRole } from '../core/auth';
import { created, ok } from '../core/respond';
import { parseBody, parseQuery } from '../core/validate';
import * as svc from '../services/appointments.service';
import { setSlotBlocked } from '../services/schedule-edit.service';
import { z } from 'zod';
import { appointmentDocumentsSchema } from '@mediconnect/shared';

// Modul 4 — UC-401..405 (+ UC-703 həkim əməliyyatları). Rol + sahiblik yoxlaması service-dədir (loadAppointment).
export const appointmentsRouter = Router();
// Diqqət: router kökə (/) qoşulub — router.use(requireAuth) bütün /v1 sorğularına təsir edərdi. Hər route öz requireRole-unu daşıyır.

const id = (v: string | string[] | undefined) => String(v);
const patient = requireRole('PATIENT');
const anyParty = requireRole('PATIENT', 'DOCTOR', 'CLINIC_ADMIN');
const dto = (req: Parameters<typeof actorOf>[0], appt: ReturnType<typeof svc.loadAppointment>) => svc.toAppointmentDto(actorOf(req), appt);

appointmentsRouter.post('/slots/:slotId/lock', patient, (req, res) => ok(req, res, svc.lockSlot(actorOf(req), id(req.params.slotId), parseBody(req, slotLockSchema).serviceId)));
appointmentsRouter.delete('/slots/:slotId/lock', patient, (req, res) => {
  svc.unlockSlot(actorOf(req));
  ok(req, res, null);
});

appointmentsRouter.post('/appointments', patient, (req, res) => created(req, res, svc.createAppointment(actorOf(req), parseBody(req, appointmentCreateSchema)), 'appointmentCreated'));
appointmentsRouter.get('/appointments', patient, (req, res) => ok(req, res, svc.listPatientAppointments(actorOf(req), parseQuery(req, appointmentListSchema).tab)));
appointmentsRouter.get('/appointments/:id', anyParty, (req, res) => ok(req, res, dto(req, svc.loadAppointment(actorOf(req), id(req.params.id)))));

appointmentsRouter.get('/appointments/:id/calendar.ics', patient, (req, res) => {
  const ics = svc.calendarIcs(actorOf(req), id(req.params.id));
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="mediconnect-randevu.ics"');
  res.send(ics);
});

appointmentsRouter.patch('/appointments/:id/cancel', anyParty, (req, res) => ok(req, res, dto(req, svc.cancelAppointment(actorOf(req), id(req.params.id), parseBody(req, cancelSchema).reason))));
appointmentsRouter.patch('/appointments/:id/reschedule', anyParty, (req, res) => ok(req, res, dto(req, svc.rescheduleAppointment(actorOf(req), id(req.params.id), parseBody(req, rescheduleSchema).newSlotId))));
appointmentsRouter.patch('/appointments/:id/reschedule/respond', patient, (req, res) => ok(req, res, dto(req, svc.respondReschedule(actorOf(req), id(req.params.id), parseBody(req, rescheduleRespondSchema).accept))));

appointmentsRouter.patch('/appointments/:id/confirm', requireRole('DOCTOR'), (req, res) => ok(req, res, dto(req, svc.confirmAppointment(actorOf(req), id(req.params.id)))));
appointmentsRouter.patch('/appointments/:id/reject', requireRole('DOCTOR'), (req, res) => ok(req, res, dto(req, svc.rejectAppointment(actorOf(req), id(req.params.id), parseBody(req, rejectSchema).reason))));
appointmentsRouter.patch('/appointments/:id/complete', requireRole('DOCTOR'), (req, res) => ok(req, res, dto(req, svc.completeAppointment(actorOf(req), id(req.params.id), parseBody(req, completeSchema).doctorNote))));
appointmentsRouter.patch('/appointments/:id/no-show', requireRole('DOCTOR', 'CLINIC_ADMIN'), (req, res) => ok(req, res, dto(req, svc.markNoShow(actorOf(req), id(req.params.id)))));
appointmentsRouter.patch('/appointments/:id/no-show/revert', requireRole('CLINIC_ADMIN'), (req, res) => ok(req, res, dto(req, svc.revertNoShow(actorOf(req), id(req.params.id)))));

// FR-702-15: tək slotun bloklanması (həkim; klinika admini — doctorId ilə).
const blockBody = z.object({ reason: z.string().trim().max(255).nullable().optional(), doctorId: z.string().uuid().optional() });
appointmentsRouter.patch('/slots/:slotId/block', requireRole('DOCTOR', 'CLINIC_ADMIN'), (req, res) => {
  const b = parseBody(req, blockBody);
  ok(req, res, setSlotBlocked(actorOf(req), id(req.params.slotId), true, b.reason, b.doctorId));
});
appointmentsRouter.patch('/slots/:slotId/unblock', requireRole('DOCTOR', 'CLINIC_ADMIN'), (req, res) => {
  const b = parseBody(req, blockBody);
  ok(req, res, setSlotBlocked(actorOf(req), id(req.params.slotId), false, null, b.doctorId));
});

// FR-404-15: randevuya sonradan sənəd əlavə etmək.
appointmentsRouter.post('/appointments/:id/documents', patient, (req, res) => ok(req, res, dto(req, svc.addDocumentsToAppointment(actorOf(req), id(req.params.id), parseBody(req, appointmentDocumentsSchema).documentIds))));
