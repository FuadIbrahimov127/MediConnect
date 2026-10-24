import { type DoctorReviewDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { REVIEW_STATUS_LABEL } from '../../i18n/labels';
import { useState } from 'react';
import { useApi } from '../../api/hooks';
import { reviewsApi } from '../../api/reviews';
import { Field, Modal } from '../../components/forms';
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import r from '../../features/reviews/reviews.module.css';
import { formatDate } from '../../lib/format';

// UC-1101 alt 3/4 — həkimin rəyləri: yalnız dərc olunmuşlar, cavab yazma (moderasiyadan keçir), uyğunsuz rəyi şikayət.
// Həkim rəyi silə və dəyişə bilməz (BR-1101-06).

const REPLY_LABEL = { PENDING_MODERATION: t('docRev.rPENDING_MODERATION'), PUBLISHED: t('docRev.rPUBLISHED'), REJECTED: t('docRev.rREJECTED') } as const;

export function DoctorReviewsPage() {
  const q = useApi((sig) => reviewsApi.doctorReviews(sig), []);
  const [replying, setReplying] = useState<DoctorReviewDto | null>(null);
  const [reporting, setReporting] = useState<DoctorReviewDto | null>(null);
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={420} radius={18} />;
  const d = q.data;
  const total = Object.values(d.distribution).reduce((a, b) => a + b, 0);

  return (
    <div className={s.stack}>
      <h1 className="page-title" style={{ margin: 0 }}>
        {t('panel.doctor.reviews')}
      </h1>
      <section className={s.section}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div className={s.statValue}>{d.avgRating?.toFixed(1) ?? '—'}</div>
            <div className={s.statLabel}>{d.reviewCount ? t('docRev.published', { n: d.reviewCount }) : t('docRev.newDoctor')}</div>
          </div>
          <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(['5', '4', '3', '2', '1'] as const).map((k) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 32px', gap: 10, alignItems: 'center', fontSize: 13 }}>
                <span className="muted">{t('reviewList.starRow', { n: k })}</span>
                <span style={{ height: 8, borderRadius: 4, background: 'var(--bg-warm)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${total ? (d.distribution[k] / total) * 100 : 0}%`, background: 'var(--accent)', borderRadius: 4 }} />
                </span>
                <span className="muted" style={{ textAlign: 'right' }}>
                  {d.distribution[k]}
                </span>
              </div>
            ))}
          </div>
        </div>
        <span className={r.meta}>{t('docRev.ratingHint')}</span>
      </section>

      {d.reviews.length === 0 ? (
        <div className="card">
          <EmptyState title={t('docRev.none')} body={t('docRev.noneBody')} />
        </div>
      ) : (
        d.reviews.map((x) => (
          <article key={x.reviewId} className={r.item}>
            <div className={r.itemHead}>
              <div>
                <span style={{ color: 'var(--accent)', letterSpacing: 2 }}>{'★'.repeat(x.overallRating)}</span>
                <span style={{ color: 'var(--line)', letterSpacing: 2 }}>{'★'.repeat(5 - x.overallRating)}</span>
                <div className={r.meta}>
                  {x.authorName} · {formatDate(x.createdAt)}
                  {x.serviceName && ` · ${x.serviceName}`}
                  {x.clinicName && ` · ${x.clinicName}`}
                </div>
              </div>
              {x.status !== 'PUBLISHED' && <Badge tone={x.status === 'WITHDRAWN' ? 'neutral' : 'warning'}>{REVIEW_STATUS_LABEL[x.status]}</Badge>}
            </div>
            {x.comment && <p className={r.text}>{x.comment}</p>}
            {x.reply && (
              <div className={r.replyBox}>
                <strong>{t('docRev.yourReply')}</strong> <span className={r.meta}>({REPLY_LABEL[x.reply.status]})</span>: {x.reply.text}
              </div>
            )}
            {(x.canReply || x.canReport || x.reportedByMe) && (
              <div className={r.actions}>
                {x.reportedByMe && <span className={r.meta}>{t('docRev.reportPending')}</span>}
                {x.canReport && (
                  <Button size="small" variant="ghost" onClick={() => setReporting(x)}>
                    {t('docRev.report')}
                  </Button>
                )}
                {x.canReply && (
                  <Button size="small" onClick={() => setReplying(x)}>
                    {x.reply?.status === 'REJECTED' ? t('docRev.newReply') : t('docRev.reply')}
                  </Button>
                )}
              </div>
            )}
          </article>
        ))
      )}
      {replying && <ReplyDialog review={replying} onClose={() => setReplying(null)} onDone={(dto) => (q.setData(dto), setReplying(null))} />}
      {reporting && <ReportDialog review={reporting} onClose={() => setReporting(null)} onDone={() => (setReporting(null), q.reload())} />}
    </div>
  );
}

function ReplyDialog({ review, onClose, onDone }: { review: DoctorReviewDto; onClose: () => void; onDone: (d: Awaited<ReturnType<typeof reviewsApi.reply>>) => void }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      onDone(await reviewsApi.reply(review.reviewId, text.trim()));
      toast.success(t('docRev.replySent'), t('docRev.replySentBody'));
    } catch (e) {
      toast.error(t('reviewList.notSent'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={t('docRev.replyTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={busy} disabled={text.trim().length < 10} onClick={() => void submit()}>
            {t('reviewList.send')}
          </Button>
        </>
      }
    >
      {review.comment && <p className={r.text} style={{ marginTop: 0 }}>“{review.comment}”</p>}
      <Field label={t('docRev.yourReply')} htmlFor="rp-text" hint={t('docRev.replyHint')}>
        <textarea id="rp-text" className="input" rows={4} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
    </Modal>
  );
}

function ReportDialog({ review, onClose, onDone }: { review: DoctorReviewDto; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await reviewsApi.report(review.reviewId, reason.trim());
      toast.success(t('reviewList.reportSent'), t('docRev.reportSentBody'));
      onDone();
    } catch (e) {
      toast.error(t('reviewList.notSent'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={t('reviewList.reportTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" loading={busy} disabled={reason.trim().length < 5} onClick={() => void submit()}>
            {t('docRev.report')}
          </Button>
        </>
      }
    >
      <p className="ink-soft" style={{ marginTop: 0 }}>
        {t('docRev.reportLead')}
      </p>
      <Field label={t('docRx.reason')} htmlFor="rep-reason">
        <textarea id="rep-reason" className="input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Modal>
  );
}
