import {
  loginLookupSchema,
  loginSchema,
  otpResendSchema,
  otpVerifySchema,
  pinResetInitiateSchema,
  pinResetSchema,
  registerCompleteSchema,
  registerInitiateSchema,
  simaSessionCreateSchema,
} from '@mediconnect/shared';
import { Router } from 'express';
import { actorOf } from '../core/actor';
import { requireAuth } from '../core/auth';
import { created, ok } from '../core/respond';
import { parseBody } from '../core/validate';
import * as auth from '../services/auth.service';
import * as profile from '../services/profile.service';
import * as sima from '../services/sima.service';

// /v1/auth — UC-101 qeydiyyat, UC-102 giriş, UC-103 PIN bərpası (api-contract.md → Auth).
export const authRouter = Router();

const deviceInfoOf = (deviceId: string | undefined, ua: string | undefined) => [deviceId, ua?.slice(0, 120)].filter(Boolean).join(' · ') || null;

authRouter.post('/register/initiate', (req, res) => {
  const body = parseBody(req, registerInitiateSchema);
  ok(req, res, auth.registerInitiate(actorOf(req), body), { message: 'otpSent' });
});

authRouter.post('/otp/resend', (req, res) => ok(req, res, auth.resendOtp(parseBody(req, otpResendSchema)), { message: 'otpSent' }));

authRouter.post('/otp/verify', (req, res) => ok(req, res, auth.verifyOtp(parseBody(req, otpVerifySchema))));

authRouter.post('/sima/session', (req, res) => created(req, res, auth.startSima(parseBody(req, simaSessionCreateSchema))));

authRouter.get('/sima/session/:id', (req, res) => {
  const status = sima.sessionStatus(req.params.id);
  // EF-101-3: SİMA uğursuz → qeydiyyat məlumatları silinir.
  if (status.sessionStatus === 'FAILED') {
    const s = sima.findSession(req.params.id);
    if (s.purpose === 'REGISTRATION') auth.discardFailedRegistration(s.flowId);
  }
  ok(req, res, status);
});

/** SİMA → MediConnect callback (server-to-server). İmza X-Sima-Signature header-indədir. */
authRouter.post('/sima/callback', (req, res) => {
  const s = sima.handleCallback(actorOf(req), req.rawBody ?? JSON.stringify(req.body ?? {}), req.get('x-sima-signature'));
  ok(req, res, { received: true, sessionStatus: s.sessionStatus });
});

authRouter.post('/register/complete', (req, res) => {
  const body = parseBody(req, registerCompleteSchema);
  created(req, res, auth.registerComplete(actorOf(req), body, deviceInfoOf(body.deviceId, req.get('user-agent'))), 'registered');
});

authRouter.post('/login/lookup', (req, res) => ok(req, res, auth.loginLookup(parseBody(req, loginLookupSchema).mobileNumber)));

authRouter.post('/login', (req, res) => ok(req, res, auth.login(actorOf(req), parseBody(req, loginSchema), req.get('user-agent') ?? null), { message: 'loggedIn' }));

authRouter.post('/pin/reset/initiate', (req, res) => ok(req, res, auth.pinResetInitiate(actorOf(req), parseBody(req, pinResetInitiateSchema).mobileNumber), { message: 'otpSent' }));

authRouter.post('/pin/reset', (req, res) => ok(req, res, auth.pinReset(actorOf(req), parseBody(req, pinResetSchema)), { message: 'pinChanged' }));

authRouter.get('/sessions', requireAuth, (req, res) => ok(req, res, profile.listSessions(actorOf(req), req.auth!.session.sessionId)));

authRouter.delete('/sessions/:id', requireAuth, (req, res) => {
  profile.revokeSession(actorOf(req), String(req.params.id));
  ok(req, res, null);
});
