import { type MyReviewDto, type ReviewEligibilityDto } from '@mediconnect/shared';
import { REVIEW_STATUS_LABEL } from '../../i18n/labels';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiClientError } from '../../api/client';
import { useApi } from '../../api/hooks';
import { reviewsApi } from '../../api/reviews';
import { Alert, Checkbox, Field } from '../../components/forms';
import { Badge, Button, ButtonLink, EmptyState, ErrorState, Skeleton, type Tone } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { StarInput } from '../../features/reviews/StarInput';
import r from '../../features/reviews/reviews.module.css';
import { tValidation, t } from '../../i18n';
import { formatDate, formatDateTime } from '../../lib/format';

// UC-1101 — rəy forması: 1–5 ulduz (məcburi), alt reytinqlər, mətn (istəyə bağlı), anonim seçim. Göndərildikdən sonra
// moderasiyaya düşür; 24 saat ərzində redaktə (dərc olunmuşda köhnə versiya moderasiyaya qədər görünür).

const TONE: Record<string, Tone> = { PENDING_MODERATION: 'warning', PUBLISHED: 'success', REJECTED: 'danger', REPORTED: 'warning', WITHDRAWN: 'neutral' };

export function ReviewPage() {
  const { appointmentId = '' } = useParams();
  const q = useApi((sig) => reviewsApi.eligibility(appointmentId, sig), [appointmentId]);
  const [editing, setEditing] = useState(false);

  if (q.error?.errorType === 'NotFound')
    return (
      <div className="card">
        <EmptyState title={t('apptDetail.notFound')} action={<ButtonLink to="/account/appointments">{t('panel.patient.appointments')}</ButtonLink>} />
      </div>
    );
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={420} radius={18} />;
  const d = q.data;
  const onSaved = (review: MyReviewDto) => (q.setData({ ...d, eligible: false, reason: 'DuplicateReview', existing: review }), setEditing(false));

  return (
    <div style={{ maxWidth: 720 }}>
      <nav style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        <Link to={`/account/appointments/${appointmentId}`} style={{ color: 'var(--muted)' }}>
          {t('review.appointment')}
        </Link>{' '}
        · {t('review.crumb')}
      </nav>
      <h1 className="page-title">{t('review.title')}</h1>
      <div className="card">
        <div className={r.head}>
          <div>
            <strong>{d.doctorName}</strong>
            <div className={r.meta}>
              {d.clinicName} · {d.serviceName} · {formatDate(d.date)}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          {d.existing && !editing ? (
            <Existing review={d.existing} onEdit={() => setEditing(true)} />
          ) : d.eligible || editing ? (
            <ReviewForm d={d} existing={editing ? d.existing : null} onSaved={onSaved} onCancel={editing ? () => setEditing(false) : undefined} />
          ) : (
            <Alert tone="warning">{d.message}</Alert>
          )}
        </div>
      </div>
    </div>
  );
}

function Existing({ review, onEdit }: { review: MyReviewDto; onEdit: () => void }) {
  return (
    <div className={r.form}>
      <div className={r.status}>
        <div>
          <Badge tone={TONE[review.status]}>{review.editPending ? t('review.editPending') : REVIEW_STATUS_LABEL[review.status]}</Badge>
        </div>
        {review.status === 'PENDING_MODERATION' && <span className="ink-soft">{t('review.inReview')}</span>}
        {review.editPending && <span className="ink-soft">{t('review.oldVersion')}</span>}
        {review.status === 'REJECTED' && review.rejectionReason && <span className="ink-soft">{t('common.reasonColon', { reason: review.rejectionReason })}</span>}
        {review.status === 'WITHDRAWN' && <span className="ink-soft">{t('review.withdrawn')} {review.rejectionReason}</span>}
      </div>
      <div>
        <span style={{ color: 'var(--accent)', fontSize: 22, letterSpacing: 2 }}>{'★'.repeat(review.overallRating)}</span>
        <span style={{ color: 'var(--line)', fontSize: 22, letterSpacing: 2 }}>{'★'.repeat(5 - review.overallRating)}</span>
        {review.isAnonymous && <span className={r.meta}>{t('review.anon')}</span>}
      </div>
      {review.comment && <p className={r.text}>{review.comment}</p>}
      {review.reply && (
        <div className={r.replyBox}>
          <strong>{t('reviewList.doctorReply')}</strong> {review.reply.text}
        </div>
      )}
      {review.canEdit ? (
        <div>
          <Button variant="ghost" onClick={onEdit}>
            {t('review.edit')}
          </Button>
          <span className={r.meta}>{t('review.until', { date: formatDateTime(review.editableUntil) })}</span>
        </div>
      ) : (
        <span className={r.meta}>{t('review.editWindow')}</span>
      )}
    </div>
  );
}

function ReviewForm({ d, existing, onSaved, onCancel }: { d: ReviewEligibilityDto; existing: MyReviewDto | null; onSaved: (r: MyReviewDto) => void; onCancel?: () => void }) {
  const toast = useToast();
  const [overall, setOverall] = useState<number | null>(existing?.overallRating ?? null);
  const [prof, setProf] = useState<number | null>(existing?.professionalismRating ?? null);
  const [att, setAtt] = useState<number | null>(existing?.attitudeRating ?? null);
  const [wait, setWait] = useState<number | null>(existing?.waitingTimeRating ?? null);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [anon, setAnon] = useState(existing?.isAnonymous ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!overall) return setErrors({ overallRating: 'validation.rating' }); // EF-1101-8
    setBusy(true);
    setErrors({});
    const body = { overallRating: overall, professionalismRating: prof, attitudeRating: att, waitingTimeRating: wait, comment: comment.trim() || null, isAnonymous: anon };
    try {
      const res = existing ? await reviewsApi.update(existing.reviewId, body) : await reviewsApi.submit(d.appointmentId, body);
      if (res.status === 'REJECTED') toast.error(t('review.cantPublish'), res.rejectionReason ?? undefined);
      else toast.success(t('review.thanks'), t('review.thanksBody'));
      onSaved(res);
    } catch (x) {
      const er = x as ApiClientError;
      if (er.details?.fields) setErrors(er.details.fields as Record<string, string>);
      toast.error(t('reviewList.notSent'), er.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={r.form} onSubmit={(e) => void submit(e)} noValidate>
      <StarInput label={t('review.overall')} value={overall} onChange={setOverall} required size={34} error={errors.overallRating ? tValidation(errors.overallRating) : undefined} />
      <div className={r.subGrid}>
        <StarInput label={t('reviewList.professionalism')} value={prof} onChange={setProf} size={22} />
        <StarInput label={t('reviewList.attitude')} value={att} onChange={setAtt} size={22} />
        <StarInput label={t('reviewList.waitingTime')} value={wait} onChange={setWait} size={22} />
      </div>
      <Field label={t('review.textLabel')} htmlFor="rv-text" hint={t('review.textHint')}>
        <textarea id="rv-text" className="input" rows={5} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <Checkbox checked={anon} onChange={setAnon}>
        {t('review.anonSend')}
      </Checkbox>
      <p className={r.meta} style={{ margin: 0 }}>
        {t('review.moderated')}{d.windowEndsAt && !existing ? t('review.deadline', { date: formatDate(d.windowEndsAt) }) : ''}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" loading={busy}>
          {existing ? t('review.sendEdit') : t('review.send')}
        </Button>
      </div>
    </form>
  );
}
