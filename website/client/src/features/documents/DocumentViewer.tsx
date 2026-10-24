import type { SignedUrlDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { documentsApi, fetchSigned } from '../../api/documents';
import { Button, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from './documents.module.css';

// Platforma daxili görüntüləyici (FR-503-07). Həkim üçün yükləmə yoxdur (BR-502-04): sağ klik bağlıdır,
// t('common.download') cəhdi serverdə DOWNLOAD_ATTEMPT kimi qeyd olunur (EF-503-3).

export function DocumentViewer({ documentId, title, onClose }: { documentId: string; title: string; onClose: () => void }) {
  const toast = useToast();
  const [meta, setMeta] = useState<SignedUrlDto | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    documentsApi
      .view(documentId)
      .then(async (m) => {
        setMeta(m);
        url = await fetchSigned(m.url);
        setBlobUrl(url);
      })
      .catch((e: Error) => setError(e.message));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (url) URL.revokeObjectURL(url);
    };
  }, [documentId, onClose]);

  const download = async () => {
    if (!meta || !blobUrl) return;
    if (meta.downloadAllowed) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = meta.fileName;
      a.click();
      return;
    }
    try {
      await documentsApi.downloadAttempt(documentId);
    } catch (e) {
      toast.error(t('docs.cantDownload'), `${(e as Error).message}. ${t('docs.cantDownloadBody')}`);
    }
  };

  return createPortal(
    <div className={s.viewerOverlay} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.viewer} onContextMenu={(e) => meta && !meta.downloadAllowed && e.preventDefault()}>
        <div className={s.viewerHead}>
          <strong>{title}</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" variant="ghost" onClick={() => void download()} disabled={!blobUrl}>
              {t('common.download')}
            </Button>
            <Button size="small" variant="secondary" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        </div>
        <div className={s.viewerBody}>
          {error && <p className={s.viewerError}>{error}</p>}
          {!error && !blobUrl && <Skeleton height={400} />}
          {blobUrl && meta?.mimeType.startsWith('image/') && <img src={blobUrl} alt={title} className={s.viewerImg} draggable={false} />}
          {blobUrl && meta?.mimeType === 'application/pdf' && <iframe title={title} src={`${blobUrl}#toolbar=${meta.downloadAllowed ? 1 : 0}`} className={s.viewerFrame} />}
        </div>
        {meta && !meta.downloadAllowed && <div className={s.viewerNote}>{t('docs.viewOnly')}</div>}
      </div>
    </div>,
    document.body,
  );
}
