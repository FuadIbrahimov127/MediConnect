import {
  drugSearchSchema,
  prescriptionCancelSchema,
  prescriptionCreateSchema,
  prescriptionListSchema,
  prescriptionSignSchema,
  prescriptionUpdateSchema,
  renewalRequestSchema,
  renewalResolveSchema,
  templateCreateSchema,
} from '@mediconnect/shared';
import { Router } from 'express';
import { z } from 'zod';
import { actorOf } from '../core/actor';
import { requireRole } from '../core/auth';
import { created, ok } from '../core/respond';
import { parseBody, parseQuery } from '../core/validate';
import * as rx from '../services/prescriptions.service';

// Modul 6 — UC-601, UC-602. Klinika admini və super admin heç bir resept endpoint-inə daxil ola bilmir (BR-600-04).
// Router kökə (/) qoşulur, ona görə router.use() yoxdur — hər route öz rolunu yoxlayır.
export const prescriptionsRouter = Router();

const doctor = requireRole('DOCTOR');
const patient = requireRole('PATIENT');
const either = requireRole('PATIENT', 'DOCTOR');
const id = (v: string | string[] | undefined) => String(v);

prescriptionsRouter.get('/drugs', doctor, (req, res) => ok(req, res, rx.searchDrugs(parseQuery(req, drugSearchSchema).query)));
prescriptionsRouter.get('/drugs/:id', either, (req, res) => ok(req, res, rx.drugInfo(id(req.params.id))));

// Açıq doğrulama (aptek) — auth tələb olunmur, tibbi detal qaytarmır.
prescriptionsRouter.get('/prescriptions/verify/:qrToken', (req, res) => ok(req, res, rx.verifyPrescription(actorOf(req), id(req.params.qrToken))));

prescriptionsRouter.post('/prescriptions', doctor, (req, res) => created(req, res, rx.createPrescription(actorOf(req), parseBody(req, prescriptionCreateSchema))));
prescriptionsRouter.get('/prescriptions', either, (req, res) => ok(req, res, rx.listPrescriptions(actorOf(req), parseQuery(req, prescriptionListSchema))));
prescriptionsRouter.get('/prescriptions/:id', either, (req, res) => ok(req, res, rx.getPrescription(actorOf(req), id(req.params.id))));
prescriptionsRouter.get('/prescriptions/:id/context', doctor, (req, res) => ok(req, res, rx.prescriptionContext(actorOf(req), id(req.params.id))));
prescriptionsRouter.patch('/prescriptions/:id', doctor, (req, res) => ok(req, res, rx.updateDraft(actorOf(req), id(req.params.id), parseBody(req, prescriptionUpdateSchema)), { message: 'saved' }));
prescriptionsRouter.post('/prescriptions/:id/check', doctor, (req, res) => ok(req, res, rx.checkPrescription(actorOf(req), id(req.params.id))));
prescriptionsRouter.post('/prescriptions/:id/sign', doctor, (req, res) => ok(req, res, rx.signPrescription(actorOf(req), id(req.params.id), parseBody(req, prescriptionSignSchema)), { message: 'prescriptionSigned' }));
prescriptionsRouter.patch('/prescriptions/:id/cancel', doctor, (req, res) => ok(req, res, rx.cancelPrescription(actorOf(req), id(req.params.id), parseBody(req, prescriptionCancelSchema).reason), { message: 'prescriptionCancelled' }));
prescriptionsRouter.get('/prescriptions/:id/pdf', either, (req, res) => {
  const { fileName, body } = rx.prescriptionPdf(actorOf(req), id(req.params.id));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.send(body);
});

prescriptionsRouter.post('/prescriptions/:id/renewal-requests', patient, (req, res) =>
  created(req, res, rx.requestRenewal(actorOf(req), id(req.params.id), parseBody(req, renewalRequestSchema).note), 'renewalRequested'),
);
prescriptionsRouter.get('/renewal-requests', doctor, (req, res) =>
  ok(req, res, rx.listRenewalRequests(actorOf(req), parseQuery(req, z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional() })).status)),
);
prescriptionsRouter.patch('/renewal-requests/:id', doctor, (req, res) => ok(req, res, rx.resolveRenewal(actorOf(req), id(req.params.id), parseBody(req, renewalResolveSchema))));

prescriptionsRouter.get('/doctor/prescription-templates', doctor, (req, res) => ok(req, res, rx.listTemplates(actorOf(req))));
prescriptionsRouter.post('/doctor/prescription-templates', doctor, (req, res) => created(req, res, rx.createTemplate(actorOf(req), parseBody(req, templateCreateSchema))));
prescriptionsRouter.delete('/doctor/prescription-templates/:id', doctor, (req, res) => ok(req, res, rx.deleteTemplate(actorOf(req), id(req.params.id))));
