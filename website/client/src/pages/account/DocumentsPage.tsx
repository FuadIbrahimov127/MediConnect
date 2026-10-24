import { ACCESS_DURATION, DOCUMENT_CATEGORY, type AccessLogDto, type DocumentCategory, type DocumentDto, type EligibleDoctorDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { Rich } from '../../i18n/Rich';
import { ACCESS_DURATION_LABEL, DOCUMENT_CATEGORY_LABEL } from '../../i18n/labels';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '../../api/client';
import { documentsApi, uploadDocument } from '../../api/documents';
import { useApi } from '../../api/hooks';
import { Alert, ConfirmDialog, Modal } from '../../components/forms';
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { DocumentViewer } from '../../features/documents/DocumentViewer';
import s from '../../features/documents/documents.module.css';
import { formatDate, formatDateTime } from '../../lib/format';

// UC-501 — sənədlərin yüklənməsi və təşkili, UC-502 — paylaşım. Kateqoriya üzrə qruplaşdırma (FR-501-15),
// axtarış, çeşidləmə, arxiv, soft delete + bərpa (30 gün).

const MAX_MB = 10;
const fmtSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const iconText = (mime: string) => (mime === 'application/pdf' ? 'PDF' : mime === 'image/png' ? 'PNG' : 'JPG');

export function DocumentsPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') ?? 'active'; // active | archived | deleted
  const category = (params.get('category') ?? '') as DocumentCategory | '';
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('DOCUMENT_DATE');
  const focus = params.get('focus');
  const list = useApi(
    (sig) => documentsApi.list({ category: category || undefined, archived: view === 'archived' ? 'true' : view === 'active' ? 'false' : undefined, deleted: view === 'deleted' ? 'true' : undefined, q: q || undefined, sort }, sig),
    [view, category, q, sort],
  );
  const [upload, setUpload] = useState(false);
  const [viewing, setViewing] = useState<DocumentDto | null>(null);
  const [sharing, setSharing] = useState<DocumentDto | null>(null);
  const [logOf, setLogOf] = useState<DocumentDto | null>(null);
  const [deleting, setDeleting] = useState<DocumentDto | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (focus && list.data) document.getElementById(`doc-${focus}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focus, list.data]);

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    next.delete('focus');
    setParams(next, { replace: true });
  };

  const groups = useMemo(() => {
    const m = new Map<DocumentCategory, DocumentDto[]>();
    for (const d of list.data ?? []) m.set(d.category, [...(m.get(d.category) ?? []), d]);
    return DOCUMENT_CATEGORY.filter((c) => m.has(c)).map((c) => [c, m.get(c)!] as const);
  }, [list.data]);

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast.success(msg);
      list.reload();
    } catch (e) {
      if (e instanceof ApiClientError && e.errorType === 'ConsentRequired') toast.error(t('docPage.consentNeeded'), t('docPage.consentNeededBody'));
      else toast.error(t('common.failed'), (e as Error).message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="page-title">{t('panel.patient.documents')}</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/account/documents/shares" className="ink-soft" style={{ alignSelf: 'center', fontWeight: 600, fontSize: 14 }}>
            {t('panel.patient.shares')}
          </Link>
          <Button arrow onClick={() => setUpload(true)}>
            {t('docPage.upload')}
          </Button>
        </div>
      </div>

      <div className={s.toolbar}>
        <div className={s.chips} role="group" aria-label={t('docPage.viewGroup')}>
          {(
            [
              ['active', t('docPage.active')],
              ['archived', t('docPage.archive')],
              ['deleted', t('docPage.deleted')],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" className={s.chip} aria-pressed={view === v} onClick={() => set('view', v === 'active' ? null : v)}>
              {l}
            </button>
          ))}
        </div>
        <select className="input" value={category} onChange={(e) => set('category', e.target.value || null)} aria-label={t('docPage.category')}>
          <option value="">{t('docPage.allCategories')}</option>
          {DOCUMENT_CATEGORY.map((c) => (
            <option key={c} value={c}>
              {DOCUMENT_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <input className="input" placeholder={t('docPage.searchPh')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('docPage.searchAria')} />
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('docPage.sort')}>
          <option value="DOCUMENT_DATE">{t('docPage.sortDocDate')}</option>
          <option value="NEWEST">{t('docPage.sortNewest')}</option>
          <option value="OLDEST">{t('docPage.sortOldest')}</option>
        </select>
      </div>

      {list.error && (list.error.errorType === 'ConsentRequired' ? (
        <Alert tone="warning">
          {t('docPage.locked')} <Link to="/account/settings">{t('panel.patient.settings')}</Link>
        </Alert>
      ) : (
        <ErrorState message={list.error.message} onRetry={list.reload} />
      ))}
      {!list.data && !list.error && <Skeleton height={240} radius={18} />}
      {list.data && list.data.length === 0 && (
        <div className="card">
          <EmptyState
            title={view === 'deleted' ? t('docPage.emptyDeleted') : view === 'archived' ? t('docPage.emptyArchive') : t('docPage.emptyActive')}
            body={view === 'active' ? t('docPage.emptyActiveBody') : undefined}
            action={view === 'active' ? <Button onClick={() => setUpload(true)}>{t('docPage.upload')}</Button> : undefined}
          />
        </div>
      )}
      {view === 'deleted' && list.data && list.data.length > 0 && <p className="field-hint">{t('docPage.deletedHint')}</p>}

      {groups.map(([cat, docs]) => (
        <section key={cat} className={s.group}>
          <h2 className={s.groupTitle}>
            {DOCUMENT_CATEGORY_LABEL[cat]} · {docs.length}
          </h2>
          <div className={s.grid}>
            {docs.map((d) => (
              <article key={d.documentId} id={`doc-${d.documentId}`} className={`${s.doc} ${focus === d.documentId ? s.docFocus : ''}`}>
                <div className={s.docHead}>
                  <span className={s.icon}>{iconText(d.mimeType)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className={s.docName}>{d.fileName}</div>
                    <div className={s.docMeta}>
                      {d.documentDate ? formatDate(d.documentDate) : t('docPage.noDate')} · {fmtSize(d.fileSizeBytes)}
                    </div>
                  </div>
                </div>
                {d.description && <div className={s.docDesc}>{d.description}</div>}
                <div className={s.docBadges}>
                  {d.activeGrants > 0 && <Badge tone="accent">{t('docPage.sharedWith', { n: d.activeGrants })}</Badge>}
                  {d.totalViews > 0 && <Badge tone="neutral">{t('docPage.views', { n: d.totalViews })}</Badge>}
                  {d.deletedAt && <Badge tone="danger">{t('docPage.restorableUntil', { date: formatDate(d.purgeAt!) })}</Badge>}
                </div>
                <div className={s.docActions}>
                  {d.deletedAt ? (
                    <button type="button" className={s.link} onClick={() => void act(() => documentsApi.restore(d.documentId), t('docPage.restored'))}>
                      {t('docPage.restore')}
                    </button>
                  ) : (
                    <>
                      <button type="button" className={s.link} onClick={() => setViewing(d)}>
                        {t('docPage.view')}
                      </button>
                      {!d.isArchived && (
                        <button type="button" className={s.link} onClick={() => setSharing(d)}>
                          {t('docPage.share')}
                        </button>
                      )}
                      <button type="button" className={s.link} onClick={() => setLogOf(d)}>
                        {t('docPage.whoViewed')}
                      </button>
                      <button type="button" className={s.linkMuted} onClick={() => void act(() => documentsApi.update(d.documentId, { isArchived: !d.isArchived }), d.isArchived ? t('docPage.unarchived') : t('docPage.archived'))}>
                        {d.isArchived ? t('docPage.unarchive') : t('docPage.doArchive')}
                      </button>
                      <button type="button" className={s.linkMuted} onClick={() => setDeleting(d)}>
                        {t('common.delete')}
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {upload && <UploadModal onClose={() => setUpload(false)} onDone={() => list.reload()} />}
      {viewing && <DocumentViewer documentId={viewing.documentId} title={viewing.fileName} onClose={() => (setViewing(null), list.reload())} />}
      {sharing && <ShareModal doc={sharing} onClose={() => setSharing(null)} onDone={() => list.reload()} />}
      {logOf && <AccessLogModal doc={logOf} onClose={() => setLogOf(null)} />}
      <ConfirmDialog
        open={!!deleting}
        danger
        title={t('docPage.deleteTitle')}
        body={t('docPage.deleteBody', { name: deleting?.fileName ?? '' })}
        confirmLabel={t('common.delete')}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          const d = deleting!;
          setDeleting(null);
          void act(() => documentsApi.remove(d.documentId), t('docPage.deletedToast'));
        }}
      />
    </div>
  );
}

// ── Yükləmə (FR-501-01..14) ──

interface Pending {
  key: number;
  file: File;
  category: DocumentCategory;
  documentDate: string;
  description: string;
  progress: number;
  status: 'ready' | 'uploading' | 'done' | 'error';
  error?: string;
}
let seq = 0;

/** FR-501-04: böyük şəkli JPEG kimi yenidən sıxışdırır. */
async function compressImage(file: File): Promise<File> {
  const img = await createImageBitmap(file);
  const k = Math.min(1, 2400 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.75));
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}

function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Pending[]>([]);
  const [drag, setDrag] = useState(false);
  const busy = items.some((i) => i.status === 'uploading');

  const add = (files: FileList | null) => {
    if (!files) return;
    const today = new Date().toISOString().slice(0, 10);
    setItems((xs) => [...xs, ...Array.from(files).map((file) => ({ key: ++seq, file, category: 'LAB_RESULT' as DocumentCategory, documentDate: today, description: '', progress: 0, status: 'ready' as const }))]);
  };
  const patch = (key: number, p: Partial<Pending>) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...p } : x)));

  const run = async () => {
    // FR-501-07: ardıcıl yükləmə, ümumi irəliləyiş.
    let ok = 0;
    for (const it of items.filter((i) => i.status === 'ready' || i.status === 'error')) {
      patch(it.key, { status: 'uploading', progress: 0, error: undefined });
      try {
        await uploadDocument(it.file, { category: it.category, documentDate: it.documentDate, description: it.description }, (p) => patch(it.key, { progress: p }));
        patch(it.key, { status: 'done', progress: 100 });
        ok++;
      } catch (e) {
        patch(it.key, { status: 'error', error: (e as Error).message });
      }
    }
    if (ok) {
      toast.success(t('docPage.uploaded', { n: ok }), t('docPage.uploadedBody'));
      onDone();
    }
  };

  const allDone = items.length > 0 && items.every((i) => i.status === 'done');
  return (
    <Modal
      open
      title={t('docPage.upload')}
      onClose={() => !busy && onClose()}
      actions={
        allDone ? (
          <Button onClick={onClose}>{t('common.close')}</Button>
        ) : (
          <>
            <Button variant="ghost" disabled={busy} onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button loading={busy} disabled={!items.some((i) => i.status === 'ready' || i.status === 'error') || items.some((i) => i.file.size > MAX_MB * 1024 * 1024 && i.status !== 'done')} onClick={() => void run()}>
              {t('common.download')}
            </Button>
          </>
        )
      }
    >
      <div style={{ display: 'grid', gap: 12, minWidth: 'min(520px, 80vw)' }}>
        <div
          className={`${s.drop} ${drag ? s.dropActive : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          onDragOver={(e) => (e.preventDefault(), setDrag(true))}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            add(e.dataTransfer.files);
          }}
        >
          <strong>{t('docPage.dropTitle')}</strong>
          <span className="field-hint">{t('docPage.dropHint', { n: MAX_MB })}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button size="small" variant="ghost" onClick={() => camRef.current?.click()}>
            {t('docPage.camera')}
          </Button>
        </div>
        <input ref={fileRef} type="file" hidden multiple accept="application/pdf,image/jpeg,image/png" onChange={(e) => (add(e.target.files), (e.target.value = ''))} />
        <input ref={camRef} type="file" hidden accept="image/*" capture="environment" onChange={(e) => (add(e.target.files), (e.target.value = ''))} />

        {items.map((it) => {
          const tooBig = it.file.size > MAX_MB * 1024 * 1024;
          return (
            <div key={it.key} className={s.fileRow}>
              <div className={s.fileRowHead}>
                <span style={{ overflowWrap: 'anywhere' }}>
                  {it.file.name} <span className="muted">· {fmtSize(it.file.size)}</span>
                </span>
                {it.status === 'ready' && (
                  <button type="button" className={s.linkMuted} onClick={() => setItems((xs) => xs.filter((x) => x.key !== it.key))}>
                    {t('docPage.remove')}
                  </button>
                )}
                {it.status === 'done' && <Badge tone="success">{t('docPage.uploadedBadge')}</Badge>}
              </div>
              {tooBig && it.status !== 'done' && (
                <Alert tone="warning">
                  <span>
                    {t('docPage.tooBig', { n: MAX_MB })}{' '}
                    {it.file.type.startsWith('image/') ? (
                      <button type="button" className={s.link} onClick={async () => patch(it.key, { file: await compressImage(it.file) })}>
                        {t('docPage.compress')}
                      </button>
                    ) : (
                      t('docPage.shrinkPdf')
                    )}
                  </span>
                </Alert>
              )}
              {it.status !== 'done' && (
                <div className={s.fileGrid}>
                  <select className="input" value={it.category} onChange={(e) => patch(it.key, { category: e.target.value as DocumentCategory })} aria-label={t('docPage.category')}>
                    {DOCUMENT_CATEGORY.map((c) => (
                      <option key={c} value={c}>
                        {DOCUMENT_CATEGORY_LABEL[c]}
                      </option>
                    ))}
                  </select>
                  <input type="date" className="input" value={it.documentDate} onChange={(e) => patch(it.key, { documentDate: e.target.value })} aria-label={t('docPage.docDate')} />
                  <input className="input" style={{ gridColumn: '1 / -1' }} maxLength={500} placeholder={t('docPage.descPh')} value={it.description} onChange={(e) => patch(it.key, { description: e.target.value })} />
                </div>
              )}
              {(it.status === 'uploading' || it.status === 'done') && (
                <div className={s.progress} aria-label={t('docPage.progress')}>
                  <span style={{ width: `${it.progress}%` }} />
                </div>
              )}
              {it.error && <Alert tone="error">{it.error}</Alert>}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

// ── Paylaşım (UC-502) ──

function ShareModal({ doc, onClose, onDone }: { doc: DocumentDto; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const q = useApi(() => documentsApi.eligibleDoctors(doc.documentId), [doc.documentId]);
  const [doctorId, setDoctorId] = useState('');
  const [duration, setDuration] = useState<string>('SEVEN_DAYS');
  const [existing, setExisting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const doctor: EligibleDoctorDto | undefined = q.data?.find((d) => d.doctorId === doctorId);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      if (existing) await documentsApi.extendGrant(existing, duration);
      else await documentsApi.grant(doc.documentId, doctorId, duration);
      toast.success(existing ? t('docPage.extended') : t('docPage.shared'), `${doctor?.fullName} — ${ACCESS_DURATION_LABEL[duration as keyof typeof ACCESS_DURATION_LABEL]}`);
      onDone();
      onClose();
    } catch (e) {
      const err = e as ApiClientError;
      if (err.errorType === 'GrantAlreadyExists') setExisting((err.details?.grant as { grantId: string }).grantId);
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open
      title={t('docPage.shareTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={pending} disabled={!doctorId} onClick={() => void submit()}>
            {existing ? t('docPage.extend') : t('docPage.grant')}
          </Button>
        </>
      }
    >
      <div style={{ minWidth: 'min(480px, 80vw)' }}>
        <strong>{doc.fileName}</strong> {t('docPage.shareLead')}
        {!q.data ? (
          <Skeleton height={100} />
        ) : q.data.length === 0 ? (
          <Alert tone="info">{t('docPage.noDoctors')}</Alert>
        ) : (
          <div className={s.doctorList} role="radiogroup">
            {q.data.map((d) => (
              <label key={d.doctorId} className={s.doctorOpt}>
                <input
                  type="radio"
                  name="doctor"
                  checked={doctorId === d.doctorId}
                  onChange={() => {
                    setDoctorId(d.doctorId);
                    setExisting(d.existingGrantId);
                    setError(null);
                  }}
                />
                <span>
                  <strong>{d.fullName}</strong>
                  <span className="muted" style={{ display: 'block', fontSize: 13 }}>
                    {d.specialties.join(', ')} · {t('docPage.lastAppt', { date: formatDate(d.lastAppointmentDate) })}
                    {d.existingGrantId && t('docPage.alreadyShared')}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
        <div className="field">
          <span className="field-label">{t('docPage.duration')}</span>
          <select className="input" value={duration} onChange={(e) => setDuration(e.target.value)}>
            {ACCESS_DURATION.map((a) => (
              <option key={a} value={a}>
                {ACCESS_DURATION_LABEL[a]}
              </option>
            ))}
          </select>
        </div>
        {doctor && (
          <p className="ink-soft" style={{ fontSize: 14 }}>
            <Rich text={t('docPage.summary', { doctor: doctor.fullName, duration: ACCESS_DURATION_LABEL[duration as keyof typeof ACCESS_DURATION_LABEL] })} b={doc.fileName} />
          </p>
        )}
        {existing && <Alert tone="info">{t('docPage.existing')}</Alert>}
        {error && !existing && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
}

function AccessLogModal({ doc, onClose }: { doc: DocumentDto; onClose: () => void }) {
  const q = useApi(() => documentsApi.accessLog(doc.documentId), [doc.documentId]);
  const label = (l: AccessLogDto) => (l.accessType === 'VIEW' ? t('docPage.accViewed') : l.accessType === 'DOWNLOAD_ATTEMPT' ? t('docPage.accDownload') : t('docPage.accDenied'));
  return (
    <Modal open title={t('docPage.logTitle', { name: doc.fileName })} onClose={onClose} actions={<Button onClick={onClose}>{t('common.close')}</Button>}>
      {!q.data ? (
        <Skeleton height={80} />
      ) : q.data.length === 0 ? (
        t('docPage.noViews')
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          {q.data.map((l) => (
            <li key={l.accessLogId}>
              <strong>{l.accessedBy}</strong> {label(l)} — {formatDateTime(l.accessedAt)}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
