import {
  accountDeletionSchema,
  allergyCreateSchema,
  chronicConditionCreateSchema,
  consentUpdateSchema,
  medicationsUpdateSchema,
  notificationPreferencesUpdateSchema,
  phoneChangeConfirmSchema,
  phoneChangeInitiateSchema,
  pinChangeSchema,
  profileUpdateSchema,
  settingsUpdateSchema,
} from '@mediconnect/shared';
import { Router } from 'express';
import { actorOf } from '../core/actor';
import { requireAuth, requireRole } from '../core/auth';
import { ok } from '../core/respond';
import { parseBody } from '../core/validate';
import * as svc from '../services/profile.service';

// /v1/profile — UC-104. Bütün endpoint-lər cari istifadəçinin öz datası üzərində işləyir.
export const profileRouter = Router();
profileRouter.use(requireAuth);
const patientOnly = requireRole('PATIENT');

profileRouter.get('/', (req, res) => ok(req, res, svc.getProfile(actorOf(req))));

profileRouter.patch('/', (req, res) => {
  svc.rejectSimaFields(req.body);
  ok(req, res, svc.updateProfile(actorOf(req), parseBody(req, profileUpdateSchema)), { message: 'saved' });
});

profileRouter.post('/allergies', patientOnly, (req, res) => ok(req, res, svc.addAllergy(actorOf(req), parseBody(req, allergyCreateSchema)), { message: 'saved' }));
profileRouter.delete('/allergies/:id', patientOnly, (req, res) => ok(req, res, svc.removeAllergy(actorOf(req), String(req.params.id))));

profileRouter.post('/chronic-conditions', patientOnly, (req, res) => ok(req, res, svc.addChronicCondition(actorOf(req), parseBody(req, chronicConditionCreateSchema)), { message: 'saved' }));
profileRouter.delete('/chronic-conditions/:id', patientOnly, (req, res) => ok(req, res, svc.removeChronicCondition(actorOf(req), String(req.params.id))));

profileRouter.patch('/medications', patientOnly, (req, res) => ok(req, res, svc.updateMedications(actorOf(req), parseBody(req, medicationsUpdateSchema)), { message: 'saved' }));

profileRouter.post('/phone-change/initiate', (req, res) => ok(req, res, svc.phoneChangeInitiate(actorOf(req), parseBody(req, phoneChangeInitiateSchema).mobileNumber), { message: 'otpSent' }));
profileRouter.post('/phone-change/confirm', (req, res) => {
  const body = parseBody(req, phoneChangeConfirmSchema);
  ok(req, res, svc.phoneChangeConfirm(actorOf(req), body.changeId, body.otpCode), { message: 'saved' });
});

profileRouter.put('/consent', patientOnly, (req, res) => {
  const body = parseBody(req, consentUpdateSchema);
  ok(req, res, svc.updateConsent(actorOf(req), body.medicalConsent, body.consentVersion), { message: 'saved' });
});

profileRouter.patch('/settings', (req, res) => ok(req, res, svc.updateSettings(actorOf(req), parseBody(req, settingsUpdateSchema)), { message: 'saved' }));

profileRouter.patch('/pin', (req, res) => {
  svc.changePin(actorOf(req), req.auth!.session.sessionId, parseBody(req, pinChangeSchema));
  ok(req, res, null, { message: 'pinChanged' });
});

profileRouter.get('/notification-preferences', (req, res) => ok(req, res, svc.getNotificationPreferences(actorOf(req))));
profileRouter.put('/notification-preferences', (req, res) =>
  ok(req, res, svc.updateNotificationPreferences(actorOf(req), parseBody(req, notificationPreferencesUpdateSchema).preferences), { message: 'saved' }),
);

profileRouter.delete('/', patientOnly, (req, res) => ok(req, res, svc.requestAccountDeletion(actorOf(req), parseBody(req, accountDeletionSchema).reason)));
profileRouter.post('/deletion/cancel', patientOnly, (req, res) => ok(req, res, svc.cancelAccountDeletion(actorOf(req))));
