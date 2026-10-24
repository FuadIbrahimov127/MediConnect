import { useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { serverNow } from '../api/client';
import { t } from '../i18n';
import { Button } from './ui';
import s from './forms.module.css';

/** OTP (6) və PIN (4) üçün ayrı-ayrı xanalar. Paste dəstəklənir; `masked` PIN-i gizlədir (FR-101-37). */
export function CodeInput({
  length,
  value,
  onChange,
  masked,
  invalid,
  autoFocus,
  label,
  onComplete,
  disabled,
}: {
  length: 4 | 6;
  value: string;
  onChange: (v: string) => void;
  masked?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  label: string;
  onComplete?: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (autoFocus) refs.current[Math.min(value.length, length - 1)]?.focus();
    // yalnız ilk render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  const onInput = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '');
    if (!d) return;
    const next = set((value.slice(0, i) + d + value.slice(i + d.length)).slice(0, length));
    refs.current[Math.min(next.length, length - 1)]?.focus();
  };

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const idx = digits[i] ? i : Math.max(0, i - 1);
      set(value.slice(0, idx) + value.slice(idx + 1));
      refs.current[idx]?.focus();
    } else if (e.key === 'ArrowLeft') refs.current[Math.max(0, i - 1)]?.focus();
    else if (e.key === 'ArrowRight') refs.current[Math.min(length - 1, i + 1)]?.focus();
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const next = set(e.clipboardData.getData('text'));
    refs.current[Math.min(next.length, length - 1)]?.focus();
  };

  return (
    <div className={`${s.codeRow} ${length === 6 ? s.codeRowSix : ''}`} role="group" aria-label={label}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={s.codeBox}
          inputMode="numeric"
          autoComplete={i === 0 && length === 6 ? 'one-time-code' : 'off'}
          type={masked ? 'password' : 'text'}
          maxLength={length}
          value={d}
          aria-label={`${label} — ${i + 1}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}

/** Server `expiresAt`-ə görə geri sayım (client vaxt təyin etmir — ui-guide.md). */
export function useCountdown(expiresAt: string | null | undefined): number {
  const [left, setLeft] = useState(() => calc(expiresAt));
  useEffect(() => {
    setLeft(calc(expiresAt));
    if (!expiresAt) return;
    const timer = setInterval(() => setLeft(calc(expiresAt)), 500);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return left;
}
// Server saatı ilə hesablanır (X-Server-Time); müddəti yenə də server yoxlayır — UI yalnız göstəricidir.
const calc = (iso: string | null | undefined) => (iso ? Math.max(0, Math.round((new Date(iso).getTime() - serverNow()) / 1000)) : 0);

export function Steps({ total, current, label }: { total: number; current: number; label: string }) {
  return (
    <>
      <div className={s.stepLabel}>
        {current}/{total} · {label}
      </div>
      <div className={s.steps} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`${s.step} ${i + 1 < current ? s.stepDone : i + 1 === current ? s.stepCurrent : ''}`} />
        ))}
      </div>
    </>
  );
}

export function Modal({ open, title, children, onClose, actions }: { open: boolean; title: string; children: ReactNode; onClose: () => void; actions?: ReactNode }) {
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className={s.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.dialog} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div id={id} className={s.dialogTitle}>
          {title}
        </div>
        <div className={s.dialogBody}>{children}</div>
        {actions && <div className={s.dialogActions}>{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Təhlükəli əməliyyatlar üçün təsdiq dialoqu (ui-guide.md). */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = t('common.confirm'),
  danger,
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {body}
    </Modal>
  );
}

export function Switch({ checked, onChange, label, disabled, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; disabled?: boolean; hint?: string }) {
  return (
    <label className={s.switch} title={hint}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className={s.track} aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className={s.check}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function Alert({ tone = 'info', children }: { tone?: 'info' | 'error' | 'success' | 'warning'; children: ReactNode }) {
  const cls = { info: s.alertInfo, error: s.alertError, success: s.alertSuccess, warning: s.alertWarning }[tone];
  return (
    <div className={`${s.alert} ${cls}`} role={tone === 'error' ? 'alert' : undefined}>
      {children}
    </div>
  );
}

/** Etiket + input + xəta mətni. */
export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}
