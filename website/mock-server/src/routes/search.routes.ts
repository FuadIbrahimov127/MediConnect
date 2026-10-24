import { clinicSearchSchema, doctorSearchSchema, reviewsQuerySchema, slotsQuerySchema } from '@mediconnect/shared';
import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../core/respond';
import { parseQuery } from '../core/validate';
import * as search from '../services/search.service';
import { doctorSlots } from '../services/slots.service';

// Public (Guest də istifadə edir — BR-201-01, BR-301-01, BR-302-01). UC-201, 202, 301, 302.
export const searchRouter = Router();

const acSchema = z.object({ query: z.string().trim().max(100).default('') });
const param = (v: string | string[] | undefined) => String(v);

searchRouter.get('/doctors', (req, res) => ok(req, res, search.searchDoctors(parseQuery(req, doctorSearchSchema), req.lang)));
searchRouter.get('/doctors/autocomplete', (req, res) => ok(req, res, search.autocomplete(parseQuery(req, acSchema).query, req.lang, 'DOCTOR')));
searchRouter.get('/doctors/:doctorId', (req, res) => ok(req, res, search.doctorDetail(param(req.params.doctorId), req.lang)));

searchRouter.get('/doctors/:doctorId/slots', (req, res) => {
  const q = parseQuery(req, slotsQuerySchema);
  const dc = search.visibleDoctorClinic(param(req.params.doctorId), q.clinicId);
  ok(req, res, doctorSlots(dc, q, req.auth?.user.userId));
});

searchRouter.get('/doctors/:doctorId/reviews', (req, res) => ok(req, res, search.doctorReviews(param(req.params.doctorId), parseQuery(req, reviewsQuerySchema), req.lang)));

searchRouter.get('/clinics', (req, res) => ok(req, res, search.searchClinics(parseQuery(req, clinicSearchSchema), req.lang)));
searchRouter.get('/clinics/autocomplete', (req, res) => ok(req, res, search.autocomplete(parseQuery(req, acSchema).query, req.lang, 'CLINIC')));
searchRouter.get('/clinics/:clinicId', (req, res) => ok(req, res, search.clinicDetail(param(req.params.clinicId), req.lang)));
searchRouter.get('/clinics/:clinicId/services', (req, res) => ok(req, res, search.clinicDetail(param(req.params.clinicId), req.lang).services));
searchRouter.get('/clinics/:clinicId/doctors', (req, res) => {
  const { specialtyId } = parseQuery(req, z.object({ specialtyId: z.string().uuid().optional() }));
  const detail = search.clinicDetail(param(req.params.clinicId), req.lang);
  const name = specialtyId ? detail.specialties.find((s) => s.id === specialtyId)?.name : null;
  ok(req, res, name ? detail.doctors.filter((d) => d.specialties.includes(name)) : detail.doctors);
});
searchRouter.get('/clinics/:clinicId/reviews', (req, res) => ok(req, res, search.clinicReviews(param(req.params.clinicId), parseQuery(req, reviewsQuerySchema), req.lang)));
