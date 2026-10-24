import { DOCUMENT_CATEGORY } from '@mediconnect/shared';
import { t } from '../../i18n';
import { DOCUMENT_CATEGORY_LABEL } from '../../i18n/labels';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { documentsApi } from '../../api/documents';
import { useApi } from '../../api/hooks';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { DocumentViewer } from '../../features/documents/DocumentViewer';
import s from '../../features/documents/documents.module.css';
import { Timeline } from '../../features/documents/Timeline';
import { formatDate, formatDateTime } from '../../lib/format';

// UC-503 — həkimə paylaşılan sənədlər (yalnız aktiv icazəlilər, bitmə vaxtı ilə) + icazəli tibbi tarixçə (UC-504 alt 1).

export function PatientDocumentsPage() {
  const { patientId = '' } = useParams();
  const q = useApi((sig) => documentsApi.doctorShared(patientId, sig), [patientId]);
  const history = useApi((sig) => documentsApi.doctorTimeline(patientId, sig), [patientId]);
  const [category, setCategory] = useState('');
  const [viewing, setViewing] = useState<{ id: string; name: string } | null>(null);

  if (q.error) return q.error.errorType === 'NotFound' ? <div className="card"><EmptyState title={t('doc.patientNotFound')} /></div> : <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={300} radius={18} />;
  const docs = q.data.documents.filter((d) => !category || d.category === category);

  return (
    <div>
      <nav style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        <Link to="/doctor/appointments" style={{ color: 'var(--muted)' }}>
          {t('panel.doctor.appointments')}
        </Link>{' '}
        · {q.data.patient.fullName}
      </nav>
      <h1 className="page-title">{t('doc.sharedDocs', { name: q.data.patient.fullName })}</h1>
      <p className="ink-soft" style={{ marginTop: -10 }}>
        {t('doc.sharedLead')}
      </p>
      <div className={s.toolbar}>
        <div className={s.chips}>
          <button type="button" className={s.chip} aria-pressed={!category} onClick={() => setCategory('')}>
            {t('shares.all')}
          </button>
          {DOCUMENT_CATEGORY.filter((c) => q.data!.documents.some((d) => d.category === c)).map((c) => (
            <button key={c} type="button" className={s.chip} aria-pressed={category === c} onClick={() => setCategory(c)}>
              {DOCUMENT_CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>
      {docs.length === 0 ? (
        <div className="card">
          <EmptyState title={t('shares.empty')} body={t('doc.noShares')} />
        </div>
      ) : (
        <div className={s.grid}>
          {docs.map((d) => (
            <article key={d.grantId} className={s.doc}>
              <div className={s.docHead}>
                <span className={s.icon}>{d.mimeType === 'application/pdf' ? 'PDF' : 'IMG'}</span>
                <div>
                  <div className={s.docName}>{d.fileName}</div>
                  <div className={s.docMeta}>
                    {DOCUMENT_CATEGORY_LABEL[d.category]} · {d.documentDate ? formatDate(d.documentDate) : t('doc.noDate')}
                  </div>
                </div>
              </div>
              {d.description && <div className={s.docDesc}>{d.description}</div>}
              <div className={s.docMeta}>{t('doc.accessUntil', { date: formatDateTime(d.expiresAt) })}</div>
              <div className={s.docActions}>
                <button type="button" className={s.link} onClick={() => setViewing({ id: d.documentId, name: d.fileName })}>
                  {t('docPage.view')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '32px 0 14px' }}>{t('doc.allowedHistory')}</h2>
      {history.data ? <Timeline data={history.data} /> : <Skeleton height={160} />}
      {viewing && <DocumentViewer documentId={viewing.id} title={viewing.name} onClose={() => (setViewing(null), q.reload())} />}
    </div>
  );
}
