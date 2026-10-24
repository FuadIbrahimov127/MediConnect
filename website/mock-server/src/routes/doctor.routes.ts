import { doctorAppointmentsQuerySchema, doctorProfileUpdateSchema, exceptionCreateSchema, schedulePutSchema, scheduleQuerySchema } from '@mediconnect/shared';
import { Router } from 'express';
import { z } from 'zod';
import { actorOf } from '../core/actor';
import { requireRole } from '../core/auth';
import { created, ok } from '../core/respond';
import { parseBody, parseQuery } from '../core/validate';
import { listDoctorAppointments } from '../services/doctor-appointments.service';
import { sharedWithDoctor } from '../services/documents.service';
import { doctorTimeline } from '../services/timeline.service';
import { timelineQuerySchema } from '@mediconnect/shared';
import * as doctor from '../services/doctor.service';
import * as schedule from '../services/schedule-edit.service';

// /v1/doctor — Modul 7 (UC-701..703). Yalnız DOCTOR rolu.
export const doctorRouter = Router();
doctorRouter.use(requireRole('DOCTOR'));

doctorRouter.get('/dashboard', (req, res) => ok(req, res, doctor.doctorDashboard(actorOf(req))));

doctorRouter.get('/profile', (req, res) => ok(req, res, doctor.getDoctorProfile(actorOf(req))));
doctorRouter.patch('/profile', (req, res) => {
  doctor.rejectLockedFields(req.body);
  ok(req, res, doctor.updateDoctorProfile(actorOf(req), parseBody(req, doctorProfileUpdateSchema)), { message: 'saved' });
});

doctorRouter.get('/schedule', (req, res) => {
  const q = parseQuery(req, scheduleQuerySchema);
  ok(req, res, schedule.getSchedule(actorOf(req), schedule.resolveDoctorClinic(actorOf(req), q.clinicId), q.from, q.days));
});
doctorRouter.put('/schedule', (req, res) => {
  const body = parseBody(req, schedulePutSchema);
  ok(req, res, schedule.saveSchedule(actorOf(req), schedule.resolveDoctorClinic(actorOf(req), body.clinicId), body));
});
doctorRouter.post('/schedule/exceptions', (req, res) => {
  const body = parseBody(req, exceptionCreateSchema);
  created(req, res, schedule.addException(actorOf(req), schedule.resolveDoctorClinic(actorOf(req), body.clinicId), body));
});
doctorRouter.delete('/schedule/exceptions/:id', (req, res) => {
  const { clinicId } = parseQuery(req, z.object({ clinicId: z.string().uuid() }));
  schedule.removeException(actorOf(req), schedule.resolveDoctorClinic(actorOf(req), clinicId), String(req.params.id));
  ok(req, res, null);
});

doctorRouter.get('/appointments', (req, res) => ok(req, res, listDoctorAppointments(actorOf(req), parseQuery(req, doctorAppointmentsQuerySchema))));

// UC-503 / UC-504 alt 1 — pasientin həkimə açdığı sənədlər və icazəli tarixçə.
doctorRouter.get('/patients/:patientId/documents', (req, res) => ok(req, res, sharedWithDoctor(actorOf(req), String(req.params.patientId))));
doctorRouter.get('/patients/:patientId/medical-history', (req, res) => ok(req, res, doctorTimeline(actorOf(req), String(req.params.patientId), parseQuery(req, timelineQuerySchema))));
