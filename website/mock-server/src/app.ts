import express, { type NextFunction, type Request, type Response } from 'express';
import { config } from './config';
import { authenticate, languageMiddleware } from './core/auth';
import { clock } from './core/clock';
import { ApiError } from './core/errors';
import { errorHandler } from './core/respond';
import { devRouter } from './dev/dev.routes';
import { appointmentsRouter } from './routes/appointments.routes';
import { authRouter } from './routes/auth.routes';
import { catalogRouter } from './routes/catalog.routes';
import { adminRouter } from './routes/admin.routes';
import { clinicAdminRouter, invitesRouter } from './routes/clinic-admin.routes';
import { doctorRouter } from './routes/doctor.routes';
import { documentsRouter } from './routes/documents.routes';
import { notificationsRouter } from './routes/notifications.routes';
import { reviewsRouter } from './routes/reviews.routes';
import { prescriptionsRouter } from './routes/prescriptions.routes';
import { profileRouter } from './routes/profile.routes';
import { searchRouter } from './routes/search.routes';
import { sessionRouter } from './routes/session.routes';
import { scheduleSave } from './store/db';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  // rawBody: SİMA callback imzası xam mətn üzərində yoxlanılır.
  app.use(express.json({ limit: '1mb', verify: (req, _res, buf) => void ((req as Request).rawBody = buf.toString('utf8')) }));
  app.use(languageMiddleware);
  // Client geri sayımları server saatına (dev time travel daxil) uyğunlaşdırsın deyə.
  app.use((_req, res, next) => {
    res.setHeader('X-Server-Time', clock.nowIso());
    next();
  });

  // Süni gecikmə — UI-da loading vəziyyətləri görünsün.
  if (config.latencyMs > 0) {
    app.use('/v1', (_req, _res, next) => void setTimeout(next, config.latencyMs));
  }
  // Mutasiyadan sonra store diskə yazılsın.
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (req.method !== 'GET') scheduleSave();
    });
    next();
  });

  const v1 = express.Router();
  v1.use(authenticate);
  v1.use('/auth', sessionRouter);
  v1.use('/auth', authRouter);
  v1.use('/profile', profileRouter);
  v1.use('/doctor', doctorRouter);
  v1.use('/clinic-admin', clinicAdminRouter);
  v1.use('/admin', adminRouter);
  v1.use('/invites', invitesRouter);
  v1.use('/', catalogRouter);
  v1.use('/', searchRouter);
  v1.use('/', appointmentsRouter);
  v1.use('/', documentsRouter);
  v1.use('/', prescriptionsRouter);
  v1.use('/', reviewsRouter);
  v1.use('/notifications', notificationsRouter);
  v1.use((_req, _res) => {
    throw new ApiError('NotFound');
  });
  app.use('/v1', v1);

  if (config.devTools) app.use('/__dev', devRouter);

  app.get('/health', (_req, res) => void res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}
