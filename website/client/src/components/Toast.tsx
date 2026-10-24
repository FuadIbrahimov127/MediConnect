import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { t } from '../i18n';
import s from './ui.module.css';

// Toast — prototipdəki kimi sağ aşağıda, başlıq + izah, 4 saniyə (ui-guide.md).

type Kind = 'info' | 'success' | 'error';
interface ToastItem {
  id: number;
  kind: Kind;
  title: string;
  body?: string;
}
interface ToastApi {
  show: (title: string, body?: string, kind?: Kind) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  const show = useCallback(
    (title: string, body?: string, kind: Kind = 'info') => {
      const id = ++seq.current;
      setItems((xs) => [...xs.slice(-3), { id, kind, title, body }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({ show, success: (t, b) => show(t, b, 'success'), error: (t, b) => show(t, b, 'error') }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={s.toasts} role="status" aria-live="polite">
        {items.map((it) => (
          <div key={it.id} className={`${s.toast} ${it.kind === 'success' ? s.toastSuccess : it.kind === 'error' ? s.toastError : ''}`}>
            <div>
              <div className={s.toastTitle}>{it.title}</div>
              {it.body && <div className={s.toastBody}>{it.body}</div>}
            </div>
            <button type="button" className={s.toastClose} onClick={() => dismiss(it.id)} aria-label={t('common.close')}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast ToastProvider daxilində istifadə olunmalıdır');
  return ctx;
}
