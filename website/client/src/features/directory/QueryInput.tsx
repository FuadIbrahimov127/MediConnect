import type { AutocompleteItemDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useEffect, useId, useRef, useState } from 'react';
import { searchApi } from '../../api/search';
import s from './directory.module.css';

// Ad / ixtisas axtarışı: autocomplete (FR-201-06, FR-202-04) və son axtarışlar (FR-201-08).

const RECENT_KEY = 'mc.recentSearches';

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function rememberSearch(q: string) {
  const v = q.trim();
  if (v.length < 2) return;
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([v, ...loadRecent().filter((x) => x !== v)].slice(0, 5)));
  } catch {
    /* yaddaş əlçatmaz */
  }
}

export function QueryInput({
  mode,
  value,
  onChange,
  onPick,
  onSubmit,
}: {
  mode: 'DOCTOR' | 'CLINIC';
  value: string;
  onChange: (v: string) => void;
  onPick: (item: AutocompleteItemDto) => void;
  onSubmit: () => void;
}) {
  const id = useId();
  const [items, setItems] = useState<AutocompleteItemDto[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<number>();

  useEffect(() => {
    if (value.trim().length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      (mode === 'DOCTOR' ? searchApi.doctorAutocomplete(value, ctrl.signal) : searchApi.clinicAutocomplete(value, ctrl.signal)).then(setItems).catch(() => undefined);
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, mode]);

  const showRecent = open && value.trim().length < 2 && recent.length > 0;
  const showItems = open && items.length > 0 && value.trim().length >= 2;

  return (
    <label className={s.searchField} style={{ display: 'block' }}>
      <span className={s.searchLabel}>{mode === 'DOCTOR' ? t('directory.queryDoctorLabel') : t('directory.queryClinicLabel')}</span>
      <input
        className={s.searchControl}
        value={value}
        placeholder={mode === 'DOCTOR' ? t('directory.queryDoctorPh') : t('directory.queryClinicPh')}
        role="combobox"
        aria-expanded={showItems || showRecent}
        aria-controls={id}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => {
          setRecent(loadRecent());
          setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (!showItems) {
            if (e.key === 'Enter') {
              e.preventDefault();
              setOpen(false);
              onSubmit();
            }
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(items.length - 1, a + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(-1, a - 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            setOpen(false);
            if (active >= 0) onPick(items[active]);
            else onSubmit();
          } else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {(showItems || showRecent) && (
        <ul id={id} className={s.suggest} role="listbox">
          {showRecent &&
            recent.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(r);
                    setOpen(false);
                    window.setTimeout(onSubmit, 0);
                  }}
                >
                  <strong>{r}</strong>
                  <small>{t('directory.recentSearch')}</small>
                </button>
              </li>
            ))}
          {showItems &&
            items.map((it, i) => (
              <li key={`${it.type}-${it.id}`} role="option" aria-selected={i === active}>
                <button type="button" data-active={i === active} onMouseDown={(e) => e.preventDefault()} onClick={() => (setOpen(false), onPick(it))}>
                  <strong>{it.label}</strong>
                  <small>{it.sub}</small>
                </button>
              </li>
            ))}
        </ul>
      )}
    </label>
  );
}
