import { useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../api/endpoints';
import { useApi } from '../api/hooks';
import { Button, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { useToast } from '../components/Toast';
import { NOTIFICATIONS_CHANGED } from '../features/notifications/useUnreadCount';
import { formatDateTime } from '../lib/format';
import { t } from '../i18n';

// UC-1001 alt 1 — bildiriş mərkəzi (bütün rollar üçün eyni komponent, route rola görə dəyişir).

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const toast = useToast();
  const q = useApi((sig) => notificationsApi.list(page, sig), [page]);
  const changed = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));

  const open = async (id: string, isRead: boolean) => {
    if (isRead) return;
    if (q.data) q.setData({ ...q.data, unreadCount: Math.max(0, q.data.unreadCount - 1), notifications: q.data.notifications.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)) });
    await notificationsApi.markRead(id).catch(() => undefined);
    changed();
  };

  const readAll = async () => {
    try {
      await notificationsApi.markAllRead();
      q.reload();
      changed();
    } catch (e) {
      toast.error(t('common.errorTitle'), (e as Error).message);
    }
  };

  const remove = async (id: string) => {
    await notificationsApi.remove(id).catch(() => undefined);
    q.reload();
    changed();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <h1 className="page-title">{t('nav.notifications')}</h1>
        {q.data && q.data.unreadCount > 0 && (
          <Button variant="ghost" size="small" onClick={readAll}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {q.loading && !q.data && (
        <div style={{ display: 'grid', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={84} radius={18} />
          ))}
        </div>
      )}
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {q.data && q.data.notifications.length === 0 && (
        <div className="card">
          <EmptyState title={t('notifications.empty')} />
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {q.data?.notifications.map((n) => {
          const body = (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <strong style={{ fontSize: 15 }}>
                  {!n.isRead && <span aria-label={t('notifications.unread')} style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: 'var(--accent)', marginRight: 8, verticalAlign: 'middle' }} />}
                  {n.title}
                </strong>
                <span className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                  {formatDateTime(n.createdAt)}
                </span>
              </div>
              <div className="ink-soft" style={{ fontSize: 14, marginTop: 6 }}>
                {n.body}
              </div>
            </>
          );
          return (
            <article key={n.notificationId} className="card" style={{ padding: 18, background: n.isRead ? 'var(--surface)' : 'var(--bg-warm)' }}>
              {n.deepLink ? (
                <Link to={n.deepLink} onClick={() => void open(n.notificationId, n.isRead)} style={{ display: 'block', color: 'inherit' }}>
                  {body}
                </Link>
              ) : (
                <div onClick={() => void open(n.notificationId, n.isRead)}>{body}</div>
              )}
              <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
                {!n.isRead && (
                  <Button variant="link" onClick={() => void open(n.notificationId, false)}>
                    {t('notifications.markRead')}
                  </Button>
                )}
                <Button variant="link" onClick={() => void remove(n.notificationId)} style={{ color: 'var(--muted)' }}>
                  {t('notifications.remove')}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {q.data && q.data.totalCount > q.data.size && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
          <Button variant="ghost" size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t('common.back')}
          </Button>
          <Button variant="ghost" size="small" disabled={page * q.data.size >= q.data.totalCount} onClick={() => setPage((p) => p + 1)}>
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
