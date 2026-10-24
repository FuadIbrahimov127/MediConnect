import { reviewBodySchema, reviewCreateSchema, reviewReplySchema, reviewReportSchema } from '@mediconnect/shared';
import { Router } from 'express';
import { actorOf } from '../core/actor';
import { requireRole } from '../core/auth';
import { created, ok } from '../core/respond';
import { parseBody } from '../core/validate';
import * as reviews from '../services/reviews.service';

// Modul 11 — UC-1101. Router kökə (/) qoşulur, ona görə router.use() yoxdur — hər route öz rolunu yoxlayır.
export const reviewsRouter = Router();

const patient = requireRole('PATIENT');
const doctor = requireRole('DOCTOR');
const id = (v: string | string[] | undefined) => String(v);

reviewsRouter.get('/reviews/eligibility/:appointmentId', patient, (req, res) => ok(req, res, reviews.reviewEligibility(actorOf(req), id(req.params.appointmentId))));
reviewsRouter.post('/reviews', patient, (req, res) => created(req, res, reviews.submitReview(actorOf(req), parseBody(req, reviewCreateSchema)), 'reviewSubmitted'));
reviewsRouter.patch('/reviews/:id', patient, (req, res) => ok(req, res, reviews.updateReview(actorOf(req), id(req.params.id), parseBody(req, reviewBodySchema)), { message: 'reviewSubmitted' }));
reviewsRouter.post('/reviews/:id/report', requireRole('PATIENT', 'DOCTOR'), (req, res) => ok(req, res, reviews.reportReview(actorOf(req), id(req.params.id), parseBody(req, reviewReportSchema).reason)));
reviewsRouter.post('/reviews/:id/reply', doctor, (req, res) => created(req, res, reviews.replyToReview(actorOf(req), id(req.params.id), parseBody(req, reviewReplySchema).replyText)));
reviewsRouter.get('/doctor/reviews', doctor, (req, res) => ok(req, res, reviews.doctorReviews(actorOf(req))));
