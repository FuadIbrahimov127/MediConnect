import { Router } from 'express';
import { actorOf } from '../core/actor';
import { audit } from '../core/audit';
import { requireAuth } from '../core/auth';
import { clock } from '../core/clock';
import { ok } from '../core/respond';
import { currentUserDto } from '../serializers/user';

// /v1/auth — sessiya ilə bağlı endpoint-lər (giriş və qeydiyyat axınları auth.routes.ts-dədir).
export const sessionRouter = Router();

sessionRouter.get('/me', requireAuth, (req, res) => ok(req, res, currentUserDto(req.auth!.user)));

sessionRouter.post('/logout', requireAuth, (req, res) => {
  req.auth!.session.revokedAt = clock.nowIso();
  audit(actorOf(req), { action: 'LOGOUT', entityType: 'USER', entityId: req.auth!.user.userId });
  ok(req, res, null, { message: 'loggedOut' });
});
