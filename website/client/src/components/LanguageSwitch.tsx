import type { Language } from '@mediconnect/shared';
import { useState, type CSSProperties } from 'react';
import { profileApi } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { currentLanguage, LANGUAGE_NAMES, setLanguage } from '../i18n';
import s from './ThemeToggle.module.css';

// Header-dəki dil seçicisi (NFR-28). Daxil olmuş istifadəçidə seçim profilə də yazılır — bildirişlər həmin dildə
// göndərilir. Dil dəyişəndə "pill" yeni dilə sürüşür, səhifə solur, yenidən yüklənir və yeni dildə yumşaq açılır.

const LANGS: Language[] = ['az', 'ru', 'en'];
const FADE_KEY = 'mc.langFade';

export function LanguageSwitch() {
  const { user } = useAuth();
  const current = currentLanguage();
  const [picked, setPicked] = useState(current);

  const change = async (lang: Language) => {
    if (lang === picked) return;
    setPicked(lang);
    setLanguage(lang);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = reduced ? 0 : new Promise((r) => setTimeout(r, 380));
    if (!reduced) {
      document.documentElement.classList.add('lang-leave');
      try {
        sessionStorage.setItem(FADE_KEY, '1');
      } catch {
        /* yaddaş əlçatmaz — sadəcə giriş animasiyası olmayacaq */
      }
    }
    await Promise.all([delay, user ? profileApi.settings({ preferredLanguage: lang }).catch(() => undefined) : undefined]);
    window.location.reload();
  };

  return (
    <div className={`${s.group} ${s.slider} ${s.lang}`} role="radiogroup" aria-label="Dil / Язык / Language" style={{ '--i': LANGS.indexOf(picked) } as CSSProperties}>
      <span className={s.indicator} aria-hidden="true" />
      {LANGS.map((l) => (
        <button key={l} type="button" role="radio" aria-checked={picked === l} className={`${s.btn} ${s.text}`} title={LANGUAGE_NAMES[l]} lang={l} onClick={() => void change(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** Yenidən yüklənmədən sonra (main.tsx-dən çağırılır): dil dəyişibsə səhifəni yumşaq göstər. */
export function playLanguageEnter() {
  try {
    if (!sessionStorage.getItem(FADE_KEY)) return;
    sessionStorage.removeItem(FADE_KEY);
  } catch {
    return;
  }
  const root = document.documentElement;
  root.classList.add('lang-enter');
  setTimeout(() => root.classList.remove('lang-enter'), 500);
}
