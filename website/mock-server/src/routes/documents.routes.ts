import { documentListSchema, documentUpdateSchema, documentUploadSchema, grantBulkSchema, grantCreateSchema, grantExtendSchema, GRANT_STATUS, timelineQuerySchema } from '@mediconnect/shared';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { actorOf } from '../core/actor';
import { requireRole } from '../core/auth';
import { created, ok } from '../core/respond';
import { parseBody, parseQuery } from '../core/validate';
import * as docs from '../services/documents.service';
import * as grants from '../services/grants.service';
import { patientTimeline } from '../services/timeline.service';

// Modul 5 — UC-501..504. Router kökə (/) qoşulur, ona görə router.use() yoxdur — hər route öz rolunu yoxlayır.
export const documentsRouter = Router();

// Fayl yaddaşda qəbul olunur (heç vaxt açıq şəkildə diskə yazılmır); ölçü limiti service-də parametrə görə yoxlanılır.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 1 } });
const patient = requireRole('PATIENT');
const id = (v: string | string[] | undefined) => String(v);

documentsRouter.post('/documents', patient, upload.single('file'), (req, res) => {
  const meta = documentUploadSchema.parse(req.body ?? {});
  const file = req.file ? { buffer: req.file.buffer, originalname: Buffer.from(req.file.originalname, 'latin1').toString('utf8'), size: req.file.size } : undefined;
  created(req, res, docs.uploadDocument(actorOf(req), file, meta));
});
documentsRouter.get('/documents', patient, (req, res) => ok(req, res, docs.listDocuments(actorOf(req), parseQuery(req, documentListSchema))));
documentsRouter.patch('/documents/:id', patient, (req, res) => ok(req, res, docs.updateDocument(actorOf(req), id(req.params.id), parseBody(req, documentUpdateSchema)), { message: 'saved' }));
documentsRouter.delete('/documents/:id', patient, (req, res) => ok(req, res, docs.deleteDocument(actorOf(req), id(req.params.id))));
documentsRouter.post('/documents/:id/restore', patient, (req, res) => ok(req, res, docs.restoreDocument(actorOf(req), id(req.params.id))));
documentsRouter.get('/documents/:id/eligible-doctors', patient, (req, res) => ok(req, res, grants.eligibleDoctors(actorOf(req), id(req.params.id))));
documentsRouter.get('/documents/:id/access-log', patient, (req, res) => ok(req, res, docs.accessLog(actorOf(req), id(req.params.id))));

documentsRouter.post('/documents/:id/grants', patient, (req, res) => {
  const b = parseBody(req, grantCreateSchema);
  created(req, res, grants.grantAccess(actorOf(req), id(req.params.id), b.doctorId, b.accessDuration), 'documentShared');
});
documentsRouter.post('/grants/bulk', patient, (req, res) => {
  const b = parseBody(req, grantBulkSchema);
  created(req, res, grants.grantBulk(actorOf(req), b.documentIds, b.doctorId, b.accessDuration), 'documentShared');
});
documentsRouter.get('/grants', patient, (req, res) => ok(req, res, grants.listGrants(actorOf(req), parseQuery(req, z.object({ status: z.enum(GRANT_STATUS).optional() })).status)));
documentsRouter.patch('/grants/:id', patient, (req, res) => ok(req, res, grants.extendGrant(actorOf(req), id(req.params.id), parseBody(req, grantExtendSchema).accessDuration)));
documentsRouter.delete('/grants/:id', patient, (req, res) => ok(req, res, grants.revokeGrant(actorOf(req), id(req.params.id))));

documentsRouter.get('/documents/:id/view', requireRole('PATIENT', 'DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN'), (req, res) => ok(req, res, docs.viewDocument(actorOf(req), id(req.params.id), req.ip ?? null)));
documentsRouter.post('/documents/:id/download-attempt', requireRole('DOCTOR'), (req) => docs.downloadAttempt(actorOf(req), id(req.params.id), req.ip ?? null));

/** Signed URL ilə fayl (auth header tələb olunmur — token özü icazədir, birdəfəlik və 60 s). */
documentsRouter.get('/files/:token', (req, res) => {
  const { doc, body } = docs.consumeSignedUrl(id(req.params.token));
  const inline = req.query.inline === '1';
  res.setHeader('Content-Type', doc.mimeType);
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`);
  res.send(body);
});

documentsRouter.get('/medical-history', patient, (req, res) => ok(req, res, patientTimeline(actorOf(req), parseQuery(req, timelineQuerySchema))));
