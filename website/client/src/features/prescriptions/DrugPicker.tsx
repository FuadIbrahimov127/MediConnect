import type { DrugDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { prescriptionsApi } from '../../api/prescriptions';
import s from './prescriptions.module.css';

// FR-601-08 — dərman bazasından axtarış; tapılmasa əl ilə daxiletmə (FR-601-16).

export function DrugPicker({ onPick, autoFocus }: { onPick: (d: DrugDto | { manual: string }) => void; autoFocus?: boolean }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<DrugDto[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      prescriptionsApi
        .drugs(query, ctrl.signal)
        .then((r) => {
          setItems(r);
          setActive(0);
        })
        .catch(() => undefined);
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  const manualAllowed = query.trim().length >= 2;
  const total = items.length + (manualAllowed ? 1 : 0);
  const choose = (i: number) => {
    if (i < items.length) onPick(items[i]);
    else if (manualAllowed) onPick({ manual: query.trim() });
    setQuery('');
    setOpen(false);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') (e.preventDefault(), setActive((x) => Math.min(x + 1, total - 1)));
    else if (e.key === 'ArrowUp') (e.preventDefault(), setActive((x) => Math.max(x - 1, 0)));
    else if (e.key === 'Enter' && open && total) (e.preventDefault(), choose(active));
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className={s.drugSearch}>
      <input
        className="input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={t('rx.drugPh')}
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => (setQuery(e.target.value), setOpen(true))}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKey}
      />
      {open && total > 0 && (
        <div className={s.drugList} id={listId} role="listbox">
          {items.map((d, i) => (
            <button key={d.drugId} type="button" role="option" aria-selected={i === active} className={s.drugOpt} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(i)}>
              <span>
                <strong>{d.tradeName}</strong> {d.strength}
                <div className={s.drugOptSub}>{[d.genericName, d.form].filter(Boolean).join(' · ')}</div>
              </span>
              {d.isControlled && <span className={s.drugOptSub}>{t('rx.controlledShort')}</span>}
            </button>
          ))}
          {manualAllowed && (
            <button type="button" role="option" aria-selected={active === items.length} className={s.drugOpt} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(items.length)}>
              <span>
                {t('rx.manualAdd')} <strong>“{query.trim()}”</strong>
                <div className={s.drugOptSub}>{t('rx.noInteractionCheck')}</div>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
