import { useId } from 'react';
import { t } from '../../i18n';
import s from './reviews.module.css';

// Ulduz reytinqi — radio qrupu kimi (klaviatura: ox düymələri; ekran oxuyucu: "4 ulduz"). Məcburi ümumi reytinq üçün
// `required`, alt kateqoriyalar üçün "seçilməyib" vəziyyəti var (null).

const LABELS = ['', t('stars.l1'), t('stars.l2'), t('stars.l3'), t('stars.l4'), t('stars.l5')];

export function StarInput({ label, value, onChange, required, size = 28, error }: { label: string; value: number | null; onChange: (v: number | null) => void; required?: boolean; size?: number; error?: string }) {
  const name = useId();
  return (
    <fieldset className={s.starField} aria-required={required || undefined}>
      <legend className={s.starLegend}>
        {label}
        {!required && value !== null && (
          <button type="button" className={s.clear} onClick={() => onChange(null)}>
            {t('stars.clear')}
          </button>
        )}
      </legend>
      <div className={s.starRow} style={{ fontSize: size }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={s.starLabel} title={LABELS[n]}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="visually-hidden" aria-label={t('stars.aria', { n, label: LABELS[n] })} />
            <span aria-hidden="true" className={value !== null && n <= value ? s.on : s.off}>
              ★
            </span>
          </label>
        ))}
        <span className={s.starText}>{value ? LABELS[value] : required ? t('stars.choose') : t('stars.notChosen')}</span>
      </div>
      {error && <span className="field-error">{error}</span>}
    </fieldset>
  );
}
