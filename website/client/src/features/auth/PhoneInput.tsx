import { useId } from 'react';
import { t } from '../../i18n';

// +994 prefiksi avtomatik (FR-101-06): istifadəçi yalnız 9 rəqəm yazır, dəyər +994XXXXXXXXX formatında qaytarılır.

export function PhoneInput({ value, onChange, error, label = t('auth.phoneNumber'), autoFocus }: { value: string; onChange: (v: string) => void; error?: string; label?: string; autoFocus?: boolean }) {
  const id = useId();
  const local = value.startsWith('+994') ? value.slice(4) : value;
  const pretty = local.replace(/^(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2}).*/, (_, a, b, c, d) => [a, b, c, d].filter(Boolean).join(' '));
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 16, top: 0, height: 48, display: 'flex', alignItems: 'center', fontWeight: 600, color: 'var(--ink-soft)' }} aria-hidden="true">
          +994
        </span>
        <input
          id={id}
          className="input"
          style={{ paddingLeft: 62 }}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="50 123 45 67"
          value={pretty}
          aria-invalid={!!error || undefined}
          autoFocus={autoFocus}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').replace(/^994/, '').replace(/^0/, '').slice(0, 9);
            onChange(`+994${digits}`);
          }}
        />
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export const phoneComplete = (v: string) => /^\+994\d{9}$/.test(v);
