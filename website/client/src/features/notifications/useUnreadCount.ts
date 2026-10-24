import { useEffect, useState } from 'react';
import { notificationsApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';

// Oxunmamış bildiriş sayğacı — 20 saniyədən bir polling (mock-backend.md: websocket lazım deyil).
// Bildiriş mərkəzi oxunmuş edəndə 'mc:notifications-changed' hadisəsi ilə dərhal yenilənir.

export const NOTIFICATIONS_CHANGED = 'mc:notifications-changed';

export function useUnreadCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = () =>
      notificationsApi
        .unreadCount()
        .then((r) => alive && setCount(r.unreadCount))
        .catch(() => undefined);
    void load();
    const timer = setInterval(load, 20_000);
    window.addEventListener(NOTIFICATIONS_CHANGED, load);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED, load);
    };
  }, [user]);

  return user ? count : 0;
}
