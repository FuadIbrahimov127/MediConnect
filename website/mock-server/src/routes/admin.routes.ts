import {
  adminClinicsQuerySchema,
  adminReasonSchema,
  adminUsersQuerySchema,
  auditQuerySchema,
  bulkApproveSchema,
  filterRulesSchema,
  moderateSchema,
  moderationQuerySchema,
  replyModerateSchema,
  catalogServiceUpsertSchema,
  clinicActionSchema,
  clinicAdminAddSchema,
  clinicCreateSchema,
  clinicDocumentAddSchema,
  clinicLicenseRenewSchema,
  drugUpsertSchema,
  interactionCreateSchema,
  securityQuerySchema,
  serviceRequestResolveSchema,
  settingUpdateSchema,
  specialtyUpsertSchema,
  templateUpdateSchema,
  userStatusSchema,
} from '@mediconnect/shared';
import { Router, type Request } from 'express';
import { z } from 'zod';
import { actorOf } from '../core/actor';
import { requireRole } from '../core/auth';
import { created, ok } from '../core/respond';
import { parseBody, parseQuery } from '../core/validate';
import * as clinics from '../services/admin-clinics.service';
import * as moderation from '../services/moderation.service';
import * as sys from '../services/admin-system.service';
import * as users from '../services/admin-users.service';

// Modul 9 — UC-901, 902, 904. Router /admin prefiksinə qoşulur — router səviyyəsində rol yoxlaması təhlükəsizdir.
// Super Admin tibbi məzmun endpoint-lərinə (sənəd, resept) giriş almır — həmin route-lar rolu ayrıca rədd edir.
export const adminRouter = Router();
adminRouter.use(requireRole('SUPER_ADMIN'));

const id = (v: string | string[] | undefined) => String(v);
const originOf = (req: Request) => req.get('origin') ?? `${req.protocol}://${req.get('host')?.replace(':4000', ':5173')}`;

adminRouter.get('/stats', (req, res) => ok(req, res, sys.platformStats(actorOf(req))));

// ── UC-901 klinikalar ──
adminRouter.get('/clinics', (req, res) => ok(req, res, clinics.listClinics(actorOf(req), parseQuery(req, adminClinicsQuerySchema))));
adminRouter.post('/clinics/license-check', (req, res) => ok(req, res, clinics.licenseRegistryCheck(parseBody(req, z.object({ licenseNumber: z.string().trim().min(2) })).licenseNumber)));
adminRouter.post('/clinics', (req, res) => created(req, res, clinics.createClinic(actorOf(req), parseBody(req, clinicCreateSchema), originOf(req))));
adminRouter.get('/clinics/:id', (req, res) => ok(req, res, clinics.clinicDetail(actorOf(req), id(req.params.id))));
adminRouter.patch('/clinics/:id', (req, res) => ok(req, res, clinics.clinicAction(actorOf(req), id(req.params.id), parseBody(req, clinicActionSchema))));
adminRouter.post('/clinics/:id/license', (req, res) => ok(req, res, clinics.renewClinicLicense(actorOf(req), id(req.params.id), parseBody(req, clinicLicenseRenewSchema))));
adminRouter.post('/clinics/:id/documents', (req, res) => created(req, res, clinics.addClinicDocument(actorOf(req), id(req.params.id), parseBody(req, clinicDocumentAddSchema).document)));
adminRouter.get('/clinics/:id/documents/:documentId', (req, res) => {
  const { doc, body } = clinics.clinicDocumentFile(actorOf(req), id(req.params.id), id(req.params.documentId));
  res.setHeader('Content-Type', doc.mimeType);
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`);
  res.send(body);
});
adminRouter.post('/clinics/:id/admins', (req, res) => created(req, res, clinics.addClinicAdmin(actorOf(req), id(req.params.id), parseBody(req, clinicAdminAddSchema), originOf(req))));
adminRouter.post('/clinics/:id/admins/:userId/resend-invite', (req, res) => ok(req, res, clinics.resendAdminInvite(actorOf(req), id(req.params.id), id(req.params.userId), originOf(req))));

// ── UC-902 istifadəçilər ──
adminRouter.get('/users', (req, res) => ok(req, res, users.listUsers(actorOf(req), parseQuery(req, adminUsersQuerySchema))));
adminRouter.get('/users/:id', (req, res) => ok(req, res, users.userDetail(actorOf(req), id(req.params.id))));
adminRouter.patch('/users/:id/status', (req, res) => ok(req, res, users.setUserStatus(actorOf(req), id(req.params.id), parseBody(req, userStatusSchema))));
adminRouter.delete('/users/:id/sessions', (req, res) => ok(req, res, users.revokeSessions(actorOf(req), id(req.params.id), parseBody(req, adminReasonSchema).reason)));
adminRouter.delete('/users/:id', (req, res) =>
  ok(req, res, users.anonymizeUser(actorOf(req), id(req.params.id), parseBody(req, adminReasonSchema.extend({ conflictResolution: z.enum(['CANCEL_AND_NOTIFY']).optional() })))),
);

// ── UC-904 parametrlər ──
adminRouter.get('/settings', (req, res) => ok(req, res, sys.listSettings(actorOf(req))));
adminRouter.get('/settings/:key/history', (req, res) => ok(req, res, sys.settingHistory(actorOf(req), id(req.params.key))));
adminRouter.patch('/settings/:key', (req, res) => ok(req, res, sys.updateSetting(actorOf(req), id(req.params.key), parseBody(req, settingUpdateSchema)), { message: 'saved' }));

// ── UC-904 kataloqlar ──
adminRouter.get('/specialties', (req, res) => ok(req, res, sys.listSpecialties(actorOf(req))));
adminRouter.post('/specialties', (req, res) => created(req, res, sys.upsertSpecialty(actorOf(req), null, parseBody(req, specialtyUpsertSchema))));
adminRouter.patch('/specialties/:id', (req, res) => ok(req, res, sys.upsertSpecialty(actorOf(req), id(req.params.id), parseBody(req, specialtyUpsertSchema))));
adminRouter.delete('/specialties/:id', (req, res) => ok(req, res, sys.deleteSpecialty(actorOf(req), id(req.params.id))));

adminRouter.get('/services', (req, res) => ok(req, res, sys.listCatalogServices(actorOf(req))));
adminRouter.post('/services', (req, res) => created(req, res, sys.upsertCatalogService(actorOf(req), null, parseBody(req, catalogServiceUpsertSchema))));
adminRouter.patch('/services/:id', (req, res) => ok(req, res, sys.upsertCatalogService(actorOf(req), id(req.params.id), parseBody(req, catalogServiceUpsertSchema))));
adminRouter.delete('/services/:id', (req, res) => ok(req, res, sys.deleteCatalogService(actorOf(req), id(req.params.id))));
adminRouter.get('/service-requests', (req, res) => ok(req, res, sys.listServiceRequests(actorOf(req))));
adminRouter.patch('/service-requests/:id', (req, res) => ok(req, res, sys.resolveServiceRequest(actorOf(req), id(req.params.id), parseBody(req, serviceRequestResolveSchema))));

adminRouter.get('/drugs', (req, res) => ok(req, res, sys.listDrugs(actorOf(req), parseQuery(req, z.object({ q: z.string().default('') })).q)));
adminRouter.post('/drugs', (req, res) => created(req, res, sys.upsertDrug(actorOf(req), null, parseBody(req, drugUpsertSchema))));
adminRouter.patch('/drugs/:id', (req, res) => ok(req, res, sys.upsertDrug(actorOf(req), id(req.params.id), parseBody(req, drugUpsertSchema.partial().extend({ tradeName: z.string().trim().min(2) })))));
adminRouter.get('/drug-interactions', (req, res) => ok(req, res, sys.listInteractions(actorOf(req))));
adminRouter.post('/drug-interactions', (req, res) => created(req, res, sys.addInteraction(actorOf(req), parseBody(req, interactionCreateSchema))));
adminRouter.delete('/drug-interactions/:id', (req, res) => ok(req, res, sys.deleteInteraction(actorOf(req), id(req.params.id))));

adminRouter.get('/notification-templates', (req, res) => ok(req, res, sys.listTemplates(actorOf(req))));
adminRouter.patch('/notification-templates/:id', (req, res) => ok(req, res, sys.updateTemplate(actorOf(req), id(req.params.id), parseBody(req, templateUpdateSchema))));

// ── UC-904 audit və təhlükəsizlik ──
adminRouter.get('/audit-logs', (req, res) => ok(req, res, sys.listAudit(actorOf(req), parseQuery(req, auditQuerySchema))));
adminRouter.get('/audit-logs/export', (req, res) => {
  const body = sys.exportAudit(actorOf(req), parseQuery(req, auditQuerySchema));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Content-Disposition', `attachment; filename="audit-log.csv"`);
  res.send(body);
});
// BR-904-04: audit log-u dəyişdirmək/silmək üçün endpoint yoxdur — cəhd 405 və təhlükəsizlik hadisəsidir (EF-904-4).
adminRouter.all(['/audit-logs/:id', '/audit-logs'], (req, res) => {
  sys.auditTamperAttempt(actorOf(req), req.method);
  res.status(405).json({ status: 'ERROR', errorType: 'Forbidden', message: 'Audit jurnalı dəyişdirilə bilməz', timestamp: new Date().toISOString() });
});
adminRouter.get('/security-events', (req, res) => ok(req, res, sys.listSecurityEvents(actorOf(req), parseQuery(req, securityQuerySchema))));

// ── UC-903 moderasiya ──
adminRouter.get('/moderation/reviews', (req, res) => ok(req, res, moderation.moderationQueue(actorOf(req), parseQuery(req, moderationQuerySchema))));
adminRouter.patch('/reviews/:id/moderate', (req, res) => ok(req, res, moderation.moderateReview(actorOf(req), id(req.params.id), parseBody(req, moderateSchema))));
adminRouter.post('/reviews/bulk-approve', (req, res) => ok(req, res, moderation.bulkApprove(actorOf(req), parseBody(req, bulkApproveSchema).reviewIds)));
adminRouter.patch('/review-replies/:id/moderate', (req, res) => ok(req, res, moderation.moderateReply(actorOf(req), id(req.params.id), parseBody(req, replyModerateSchema))));
adminRouter.get('/moderation/filter-rules', (req, res) => ok(req, res, moderation.getFilterRules(actorOf(req))));
adminRouter.put('/moderation/filter-rules', (req, res) => ok(req, res, moderation.updateFilterRules(actorOf(req), parseBody(req, filterRulesSchema)), { message: 'saved' }));
