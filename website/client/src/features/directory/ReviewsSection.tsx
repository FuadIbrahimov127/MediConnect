import type { ReviewListDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useState } from 'react';
import { useApi } from '../../api/hooks';
import { reviewsApi } from '../../api/reviews';
import { useAuth } from '../../auth/AuthContext';
import { Field, Modal } from '../../components/forms';
import { Button, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../lib/format';
import { Stars } from './cards';
import s from './directory.module.css';

// Pasient rəyləri (FR-301-22..25, FR-302-17): yalnız dərc olunmuşlar, reytinq paylanması, alt reytinqlər, çeşidləmə.

export function ReviewsSection({
  load,
  title = t('reviewList.title'),
  showDoctor,
}: {
  load: (q: { sort: string; page: number; size: number }, signal: AbortSignal) => Promise<ReviewListDto>;
  title?: string;
  /** Klinika səhifəsində rəyin hansı həkimə aid olduğu göstərilir. */
  showDoctor?: boolean;
}) {
  const [sort, setSort] = useState('NEWEST');
  const [size, setSize] = useState(5);
  const { user } = useAuth();
  const [reporting, setReporting] = useState<string | null>(null);
  const q = useApi((sig) => load({ sort, page: 1, size }, sig), [sort, size]);
  const data = q.data;

  return (
    <section className="card" aria-labelledby="reviews-title">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <h2 id="reviews-title" className={s.h2}>
          {title}
        </h2>
        {data && data.totalCount > 1 && (
          <select className={s.sortSelect} value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('reviewList.sortLabel')}>
            <option value="NEWEST">{t('reviewList.newest')}</option>
            <option value="HIGHEST">{t('reviewList.highest')}</option>
            <option value="LOWEST">{t('reviewList.lowest')}</option>
          </select>
        )}
      </div>
      {!data ? (
        <Skeleton height={160} />
      ) : data.totalCount === 0 ? (
        <p className="ink-soft" style={{ margin: 0 }}>
          {t('reviewList.empty')}
        </p>
      ) : (
        <>
          <div className={s.reviewSummary}>
            <div>
              <div className={s.bigRating}>{data.summary.average?.toFixed(1)}</div>
              <div className="muted" style={{ fontSize: 13, fontWeight: 500, marginTop: 8 }}>
                {t('reviewList.count', { n: data.summary.count })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['5', '4', '3', '2', '1'] as const).map((k) => {
                const n = data.summary.distribution[k];
                const pct = data.summary.count ? Math.round((n / data.summary.count) * 100) : 0;
                return (
                  <div key={k} className={s.distRow}>
                    <span>{t('reviewList.starRow', { n: k })}</span>
                    <span className={s.bar}>
                      <span className={s.barFill} style={{ width: `${pct}%` }} />
                    </span>
                    <span style={{ textAlign: 'right', color: 'var(--muted)' }}>{n}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={s.subRatings}>
            {data.summary.professionalism !== null && (
              <span>
                {t('reviewList.professionalism')} <strong>{data.summary.professionalism}</strong>
              </span>
            )}
            {data.summary.attitude !== null && (
              <span>
                {t('reviewList.attitude')} <strong>{data.summary.attitude}</strong>
              </span>
            )}
            {data.summary.waitingTime !== null && (
              <span>
                {t('reviewList.waitingTime')} <strong>{data.summary.waitingTime}</strong>
              </span>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            {data.reviews.map((r) => (
              <article key={r.reviewId} className={s.review}>
                <Stars value={r.overallRating} />
                {r.comment && <p className={s.reviewText}>{r.comment}</p>}
                <div className={s.reviewMeta}>
                  {r.authorName}{' '}
                  <span>
                    · {formatDate(r.createdAt)}
                    {r.serviceName ? ` · ${r.serviceName}` : ''}
                    {showDoctor ? ` · ${r.doctorName}` : ''}
                  </span>
                </div>
                {r.reply && (
                  <div className={s.reply}>
                    <strong>{t('reviewList.doctorReply')}</strong> {r.reply.text}
                  </div>
                )}
                {user?.role === 'PATIENT' && (
                  <button type="button" className={s.reportLink} onClick={() => setReporting(r.reviewId)}>
                    {t('reviewList.report')}
                  </button>
                )}
              </article>
            ))}
          </div>
          {data.totalCount > data.reviews.length && (
            <Button variant="ghost" size="small" onClick={() => setSize((x) => x + 10)} loading={q.loading}>
              {t('reviewList.more', { n: data.totalCount - data.reviews.length })}
            </Button>
          )}
        </>
      )}
      {reporting && <ReportDialog reviewId={reporting} onClose={() => setReporting(null)} />}
    </section>
  );
}

/** UC-1101 alt 4: istifadəçi uyğunsuz rəyi şikayət edir — moderator yenidən baxır. */
function ReportDialog({ reviewId, onClose }: { reviewId: string; onClose: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await reviewsApi.report(reviewId, reason.trim());
      toast.success(t('reviewList.reportSent'), t('reviewList.reportSentBody'));
      onClose();
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
            {t('reviewList.send')}
          </Button>
        </>
      }
    >
      <Field label={t('reviewList.reason')} htmlFor="rv-report">
        <textarea id="rv-report" className="input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('reviewList.reasonPh')} />
      </Field>
    </Modal>
  );
}
