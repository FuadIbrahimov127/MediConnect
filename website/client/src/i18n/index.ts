import type { Language } from '@mediconnect/shared';
import { az, type Dict } from './az';
import { en } from './en';
import { ru } from './ru';

// Minimal i18n: t('home.titleA'), t('notifications.unread'). AZ əsasdır; RU/EN eyni açarlarla (NFR-28).
// Dil dəyişəndə səhifə yenidən yüklənir — t() reaktiv deyil, sadəlik üçün bütün ağac təzə render olunur.

const dictionaries: Record<Language, Dict> = { az, ru, en };
export const LANGUAGE_NAMES: Record<Language, string> = { az: 'Azərbaycanca', ru: 'Русский', en: 'English' };
const LANG_KEY = 'mc.lang';

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type Paths<T> = { [K in keyof T]: T[K] extends string ? K : Join<K, Paths<T[K]>> }[keyof T];
export type TKey = Paths<Dict>;

export function currentLanguage(): Language {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === 'ru' || v === 'en' ? v : 'az';
  } catch {
    return 'az';
  }
}

export function setLanguage(lang: Language) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* yaddaş əlçatmaz */
  }
  document.documentElement.lang = lang;
}

function lookup(dict: unknown, key: string): string | undefined {
  const v = key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), dict);
  return typeof v === 'string' ? v : undefined;
}

export function t(key: TKey, vars?: Record<string, string | number>): string {
  const text = lookup(dictionaries[currentLanguage()], key) ?? lookup(az, key) ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : text;
}

/** zod mesaj açarını ('validation.fin') mətnə çevirir; açar deyilsə olduğu kimi qaytarır. */
export const tValidation = (message: string) => (message.startsWith('validation.') ? t(message as TKey) : message);
