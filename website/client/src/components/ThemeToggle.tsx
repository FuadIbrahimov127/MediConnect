import type { CSSProperties } from 'react';
import { t } from '../i18n';
import { useThemePref, type ThemePref } from '../lib/theme';
import s from './ThemeToggle.module.css';

// Header-dəki rəng rejimi seçicisi: Sistem / Açıq / Tünd (radio qrupu — klaviatura ilə də işləyir).
// Seçim dəyişəndə fon "pill"-i yeni düyməyə sürüşür, ikon fırlanır, səhifə rəngləri yumşaq keçir (lib/theme.ts).

const OPTIONS: { value: ThemePref; label: string; icon: JSX.Element }[] = [
  {
    value: 'system',
    label: t('common.themeSystem'),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
  },
  {
    value: 'light',
    label: t('common.themeLight'),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: t('common.themeDark'),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
];

export function ThemeToggle() {
  const [pref, setPref] = useThemePref();
  const index = OPTIONS.findIndex((o) => o.value === pref);
  return (
    <div className={`${s.group} ${s.slider}`} role="radiogroup" aria-label={t('common.colorMode')} style={{ '--i': index } as CSSProperties}>
      <span className={s.indicator} aria-hidden="true" />
      {OPTIONS.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={pref === o.value} className={s.btn} title={o.label} aria-label={`${t('common.colorMode')}: ${o.label}`} onClick={() => setPref(o.value)}>
          {o.icon}
        </button>
      ))}
    </div>
  );
}
