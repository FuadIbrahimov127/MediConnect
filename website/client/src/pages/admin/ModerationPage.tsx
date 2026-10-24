import { MODERATION_QUEUES, type ModerationItemDto, type ModerationQueue } from '@mediconnect/shared';
import { t } from '../../i18n';
import { FILTER_FLAG_LABEL } from '../../i18n/labels';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../api/hooks';
import { moderationApi } from '../../api/reviews';
import { Alert, Field, Modal } from '../../components/forms';
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import r from '../../features/reviews/reviews.module.css';
import { formatDateTime } from '../../lib/format';

// UC-903 — moderasiya növbəsi: gözləyən (yeni + redaktə), şikayət edilmiş, həkim cavabları, rədd edilmiş, dərc olunmuş.
// Avtomatik filtr nəticəsi hər elementdə; təsdiq / redaktə edilmiş versiya ilə təsdiq / rədd (səbəb məcburi) /
// geri çəkmə / şikayəti rədd etmə; toplu təsdiq yalnız filtrdən təmiz keçənlər üçün; filtr qaydaları.

const QUEUE_LABEL: Record<ModerationQueue, string> = { PENDING: t('mod.qPENDING'), REPORTED: t('mod.qREPORTED'), REPLIES: t('mod.qREPLIES'), REJECTED: t('mod.qREJECTED'), PUBLISHED: t('mod.qPUBLISHED') };
const REJECT_PRESETS = [t('mod.p1'), t('mod.p2'), t('mod.p3'), t('mod.p4'), t('mod.p5')];

type Dialog = { item: ModerationItemDto; kind: 'REJECT' | 'WITHDRAW' | 'REDACT' | 'REPLY_REJECT' } | null;

export function ModerationPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const queue = ((MODERATION_QUEUES as readonly string[]).includes(params.get('queue') ?? '') ? params.get('queue') : 'PENDING') as ModerationQueue;
  const page = Number(params.get('page') ?? 1);
  const q = useApi((sig) => moderationApi.queue(queue, page, sig), [queue, page]);
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  useEffect(() => setSelected([]), [queue, page]);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast.success(msg);
      setDialog(null);
      q.reload();
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    }
  };
  const bulk = () =>
    void run(async () => {
      const res = await moderationApi.bulkApprove(selected);
      if (res.skipped) toast.error(t('mod.skipped', { n: res.skipped }), t('mod.skippedBody'));
      setSelected([]);
    }, t('mod.bulkDone'));
  const cleanIds = (q.data?.items ?? []).filter((x) => x.kind === 'REVIEW' && x.status === 'PENDING_MODERATION' && !x.filterFlags.length).map((x) => x.reviewId);
  const pages = q.data ? Math.max(1, Math.ceil(q.data.totalCount / q.data.size)) : 1;

  return (
    <div className={s.stack}>
      <div className={s.sectionHead}>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('panel.admin.moderation')}
        </h1>
        <Button size="small" variant="ghost" onClick={() => setRulesOpen(true)}>
          {t('mod.rules')}
        </Button>
      </div>
      <div className={s.chips} role="tablist">
        {MODERATION_QUEUES.map((qq) => (
          <button key={qq} type="button" role="tab" aria-selected={queue === qq} aria-pressed={queue === qq} className={s.chipToggle} onClick={() => setParams({ queue: qq }, { replace: true })}>
            {QUEUE_LABEL[qq]}
            {q.data && q.data.counts[qq] > 0 && ` · ${q.data.counts[qq]}`}
          </button>
        ))}
      </div>
      {queue === 'PENDING' && cleanIds.length > 0 && (
        <div className={s.row}>
          <label className={r.select}>
            <input type="checkbox" checked={cleanIds.every((id) => selected.includes(id))} onChange={(e) => setSelected(e.target.checked ? cleanIds : [])} />
            {t('mod.selectClean', { n: cleanIds.length })}
          </label>
          <Button size="small" disabled={!selected.length} onClick={bulk}>
            {t('mod.bulkApprove', { n: selected.length })}
          </Button>
        </div>
      )}
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={360} radius={16} />}
      {q.data && q.data.items.length === 0 && (
        <div className="card">
          <EmptyState title={t('mod.emptyQueue')} body={t('mod.emptyQueueBody')} />
        </div>
      )}
      {q.data?.items.map((x) => (
        <Item
          key={`${x.reviewId}-${x.replyId ?? ''}`}
          x={x}
          selectable={queue === 'PENDING' && x.status === 'PENDING_MODERATION' && !x.filterFlags.length}
          selected={selected.includes(x.reviewId)}
          onSelect={(v) => setSelected((l) => (v ? [...l, x.reviewId] : l.filter((y) => y !== x.reviewId)))}
          onApprove={() => void run(() => (x.kind === 'REPLY' ? moderationApi.moderateReply(x.replyId!, { decision: 'APPROVE' }) : moderationApi.moderate(x.reviewId, { decision: 'APPROVE' })), t('mod.published'))}
          onDismiss={() => void run(() => moderationApi.moderate(x.reviewId, { decision: 'DISMISS_REPORT' }), t('mod.dismissed'))}
          onDialog={(kind) => setDialog({ item: x, kind })}
        />
      ))}
      {pages > 1 && (
        <div className={s.actions} style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Button size="small" variant="ghost" disabled={page <= 1} onClick={() => setParams({ queue, page: String(page - 1) }, { replace: true })}>
            {t('caAppt.prev')}
          </Button>
          <span className="muted" style={{ fontSize: 14 }}>
            {page} / {pages}
          </span>
          <Button size="small" variant="ghost" disabled={page >= pages} onClick={() => setParams({ queue, page: String(page + 1) }, { replace: true })}>
            {t('caAppt.next')}
          </Button>
        </div>
      )}
      {dialog && <DecisionDialog d={dialog} onClose={() => setDialog(null)} onRun={run} />}
      {rulesOpen && <RulesDialog onClose={() => setRulesOpen(false)} />}
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={t('directory.stars', { n })}>
      <span style={{ color: 'var(--accent)', letterSpacing: 2 }}>{'★'.repeat(n)}</span>
      <span style={{ color: 'var(--line)', letterSpacing: 2 }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

function Item({
  x, selectable, selected, onSelect, onApprove, onDismiss, onDialog,
}: {
  x: ModerationItemDto; selectable: boolean; selected: boolean; onSelect: (v: boolean) => void; onApprove: () => void; onDismiss: () => void;
  onDialog: (k: 'REJECT' | 'WITHDRAW' | 'REDACT' | 'REPLY_REJECT') => void;
}) {
  const editPending = x.status === 'EDIT_PENDING';
  return (
    <article className={r.item}>
      <div className={r.itemHead}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {selectable && <input type="checkbox" aria-label={t('mod.bulkSelect')} checked={selected} onChange={(e) => onSelect(e.target.checked)} style={{ marginTop: 4 }} />}
          <div>
            {x.kind === 'REPLY' ? <strong>{t('mod.replyTo', { name: x.doctorName ?? '' })}</strong> : x.ratings && <Stars n={x.ratings.overallRating} />}
            <div className={r.meta}>
              {x.kind === 'REVIEW' && <>{x.isAnonymous ? t('mod.anonPatient') : x.patientName} → </>}
              {x.kind === 'REVIEW' && x.doctorName}
              {x.clinicName && ` · ${x.clinicName}`} · {formatDateTime(x.createdAt)}
            </div>
          </div>
        </div>
        <div className={r.flags}>
          {editPending && <Badge tone="accent">{t('mod.edit')}</Badge>}
          {x.filterFlags.length === 0 ? <Badge tone="success">{t('mod.clean')}</Badge> : x.filterFlags.map((f) => <Badge key={f} tone={f === 'PROFANITY' ? 'danger' : 'warning'}>{FILTER_FLAG_LABEL[f] ?? f}</Badge>)}
        </div>
      </div>
      {x.kind === 'REPLY' && x.reviewText && <div className={r.meta}>{t('mod.reviewQuote', { text: x.reviewText })}</div>}
      {editPending && x.previous ? (
        <div className={r.diff}>
          <div>
            <div className={r.meta}>{t('mod.publishedVersion')}</div>
            <Stars n={x.previous.overallRating} />
            <div>{x.previous.comment ?? <em className="muted">{t('mod.noText')}</em>}</div>
          </div>
          <div>
            <div className={r.meta}>{t('mod.newVersion')}</div>
            <Stars n={x.ratings!.overallRating} />
            <div>{x.text ?? <em className="muted">{t('mod.noText')}</em>}</div>
          </div>
        </div>
      ) : x.text ? (
        <p className={r.text}>{x.text}</p>
      ) : (
        <span className={r.meta}>{t('mod.starsOnly')}</span>
      )}
      {x.ratings && (x.ratings.professionalismRating || x.ratings.attitudeRating || x.ratings.waitingTimeRating) && (
        <div className={r.meta}>
          {t('mod.subRatings', { p: x.ratings.professionalismRating ?? '—', a: x.ratings.attitudeRating ?? '—', w: x.ratings.waitingTimeRating ?? '—' })}
        </div>
      )}
      {x.filterFlags.includes('MEDICAL_DETAIL') && <Alert tone="warning">{t('mod.privacyRisk')}</Alert>}
      {x.reports.map((rep, i) => (
        <div key={i} className={r.report}>
          <strong>{t('mod.reportBy', { who: rep.reporterRole === 'DOCTOR' ? t('mod.byDoctor') : t('mod.byUser') })}</strong> {rep.reason} <span className={r.meta}>· {formatDateTime(rep.createdAt)}</span>
        </div>
      ))}
      {x.rejectionReason && (x.status === 'REJECTED' || x.status === 'WITHDRAWN') && <div className={r.meta}>{t('common.reasonColon', { reason: x.rejectionReason })}</div>}
      <div className={r.actions}>
        {x.kind === 'REPLY' && x.status === 'PENDING_MODERATION' && (
          <>
            <Button size="small" variant="ghost" onClick={() => onDialog('REPLY_REJECT')}>
              {t('docAppt.reject')}
            </Button>
            <Button size="small" onClick={onApprove}>
              {t('common.confirm')}
            </Button>
          </>
        )}
        {x.kind === 'REVIEW' && (x.status === 'PENDING_MODERATION' || editPending) && (
          <>
            <Button size="small" variant="ghost" onClick={() => onDialog('REJECT')}>
              {t('docAppt.reject')}
            </Button>
            {x.text && (
              <Button size="small" variant="ghost" onClick={() => onDialog('REDACT')}>
                {t('mod.redactPublish')}
              </Button>
            )}
            <Button size="small" onClick={onApprove}>
              {t('common.confirm')}
            </Button>
          </>
        )}
        {x.kind === 'REVIEW' && x.status === 'REPORTED' && (
          <>
            <Button size="small" variant="danger" onClick={() => onDialog('WITHDRAW')}>
              {t('mod.withdraw')}
            </Button>
            <Button size="small" onClick={onDismiss}>
              {t('mod.dismiss')}
            </Button>
          </>
        )}
        {x.kind === 'REVIEW' && x.status === 'PUBLISHED' && (
          <Button size="small" variant="danger" onClick={() => onDialog('WITHDRAW')}>
            {t('mod.withdraw')}
          </Button>
        )}
      </div>
    </article>
  );
}

function DecisionDialog({ d, onClose, onRun }: { d: NonNullable<Dialog>; onClose: () => void; onRun: (fn: () => Promise<unknown>, msg: string) => Promise<void> }) {
  const [reason, setReason] = useState('');
  const [text, setText] = useState(d.item.text ?? '');
  const [busy, setBusy] = useState(false);
  const title = { REJECT: t('mod.rejectReview'), WITHDRAW: t('mod.withdrawReview'), REDACT: t('mod.redactPublish'), REPLY_REJECT: t('mod.rejectReply') }[d.kind];
  const submit = async () => {
    setBusy(true);
    const x = d.item;
    if (d.kind === 'REDACT') await onRun(() => moderationApi.moderate(x.reviewId, { decision: 'APPROVE', redactedComment: text.trim() }), t('mod.redactedDone'));
    else if (d.kind === 'REPLY_REJECT') await onRun(() => moderationApi.moderateReply(x.replyId!, { decision: 'REJECT', reason: reason.trim() }), t('mod.replyRejected'));
    else await onRun(() => moderationApi.moderate(x.reviewId, { decision: d.kind as 'REJECT' | 'WITHDRAW', reason: reason.trim() }), d.kind === 'REJECT' ? t('mod.reviewRejected') : t('mod.reviewWithdrawn'));
    setBusy(false);
  };
  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant={d.kind === 'REDACT' ? 'primary' : 'danger'} loading={busy} disabled={d.kind === 'REDACT' ? !text.trim() : reason.trim().length < 5} onClick={() => void submit()}>
            {title}
          </Button>
        </>
      }
    >
      {d.kind === 'REDACT' ? (
        <Field label={t('mod.textToPublish')} htmlFor="md-text" hint={t('mod.redactHint')}>
          <textarea id="md-text" className="input" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
      ) : (
        <>
          {d.kind !== 'REPLY_REJECT' && (
            <div className={s.chips} style={{ marginBottom: 10 }}>
              {REJECT_PRESETS.map((p) => (
                <button key={p} type="button" className={s.chipToggle} aria-pressed={reason === p} onClick={() => setReason(p)}>
                  {p}
                </button>
              ))}
            </div>
          )}
          <Field label={d.item.kind === 'REPLY' ? t('mod.reasonDoctor') : t('mod.reasonPatient')} htmlFor="md-reason">
            <textarea id="md-reason" className="input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          {d.kind === 'WITHDRAW' && <p className="muted" style={{ fontSize: 13, margin: 0 }}>{t('mod.withdrawInfo')}</p>}
        </>
      )}
    </Modal>
  );
}

function RulesDialog({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const q = useApi((sig) => moderationApi.rules(sig), []);
  const [words, setWords] = useState<string[] | null>(null);
  const [sens, setSens] = useState<'LOW' | 'MEDIUM' | 'HIGH' | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const list = words ?? q.data?.bannedWords ?? [];
  const sensitivity = sens ?? q.data?.sensitivity ?? 'MEDIUM';
  const save = async () => {
    setBusy(true);
    try {
      await moderationApi.saveRules({ bannedWords: list, sensitivity });
      toast.success(t('mod.rulesUpdated'), t('mod.rulesUpdatedBody'));
      onClose();
    } catch (e) {
      toast.error(t('rxEdit.notSaved'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={t('mod.rulesTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={busy} disabled={!q.data} onClick={() => void save()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      {!q.data ? (
        <Skeleton height={120} />
      ) : (
        <>
          <Field label={t('mod.sensitivity')} htmlFor="fr-sens" hint={t('mod.sensHint')}>
            <select id="fr-sens" className="input" value={sensitivity} onChange={(e) => setSens(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}>
              <option value="LOW">{t('mod.low')}</option>
              <option value="MEDIUM">{t('mod.medium')}</option>
              <option value="HIGH">{t('mod.high')}</option>
            </select>
          </Field>
          <Field label={t('mod.banned')} htmlFor="fr-word">
            <div className={s.chips} style={{ marginBottom: 8 }}>
              {list.map((w) => (
                <span key={w} className={s.chip}>
                  {w}
                  <button type="button" aria-label={t('caProf.removeX', { name: w })} onClick={() => setWords(list.filter((x) => x !== w))}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              id="fr-word"
              className="input"
              value={input}
              placeholder={t('mod.wordPh')}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && input.trim().length >= 2) {
                  e.preventDefault();
                  setWords([...new Set([...list, input.trim().toLocaleLowerCase('az')])]);
                  setInput('');
                }
              }}
            />
          </Field>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            {t('mod.alwaysFlagged')}
          </p>
        </>
      )}
    </Modal>
  );
}
