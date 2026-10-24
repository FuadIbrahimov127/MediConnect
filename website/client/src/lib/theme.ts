import { useEffect, useState } from 'react';

// Rəng rejimi: Sistem (OS seçimi) / Açıq / Tünd. Seçim brauzerdə saxlanılır (yalnız bu cihaz üçün rahatlıq);
// tokenlər tokens.css-də — `data-theme` atributu OS seçimini üstələyir. index.html-dəki inline skript ilk boyamadan
// əvvəl tətbiq edir ki, ekran yanıb-sönməsin.

export type ThemePref = 'system' | 'light' | 'dark';
const KEY = 'mc.theme';

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === 'system') delete root.dataset.theme;
  else root.dataset.theme = pref;
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121716' : '#FAF9F7');
}

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    /* yaddaş əlçatmaz — seçim yalnız bu sessiyada qüvvədədir */
  }
  // Bütün səhifə yumşaq keçir (View Transitions API); dəstəklənməyəndə və ya "hərəkəti azalt"da dərhal.
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (doc.startViewTransition && !reduce) doc.startViewTransition(() => applyTheme(pref));
  else applyTheme(pref);
  window.dispatchEvent(new CustomEvent('mc:theme', { detail: pref }));
}

export function useThemePref(): [ThemePref, (p: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(getThemePref);
  useEffect(() => {
    const onChange = (e: Event) => setPref((e as CustomEvent<ThemePref>).detail);
    window.addEventListener('mc:theme', onChange);
    // OS rejimi dəyişəndə "Sistem" seçimində theme-color meta da yenilənsin.
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onOs = () => getThemePref() === 'system' && applyTheme('system');
    mq?.addEventListener?.('change', onOs);
    return () => {
      window.removeEventListener('mc:theme', onChange);
      mq?.removeEventListener?.('change', onOs);
    };
  }, []);
  return [pref, setThemePref];
}
