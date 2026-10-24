import { paginationSchema } from '@mediconnect/shared';
import { Router } from 'express';
import { actorOf } from '../core/actor';
import { requireAuth } from '../core/auth';
import { ok } from '../core/respond';
import { parseQuery } from '../core/validate';
import * as svc from '../services/notifications.service';

// UC-1001 — bildiriş mərkəzi.
export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', (req, res) => {
  const { page, size } = parseQuery(req, paginationSchema);
  ok(req, res, svc.listNotifications(actorOf(req), page, size));
});

notificationsRouter.get('/unread-count', (req, res) => ok(req, res, { unreadCount: svc.unreadCount(actorOf(req)) }));

notificationsRouter.post('/read-all', (req, res) => {
  svc.markAllRead(actorOf(req));
  ok(req, res, { unreadCount: 0 });
});

notificationsRouter.patch('/:id/read', (req, res) => ok(req, res, svc.markRead(actorOf(req), req.params.id)));

notificationsRouter.delete('/:id', (req, res) => {
  svc.deleteNotification(actorOf(req), req.params.id);
  ok(req, res, null);
});
