import type { DoctorSlotsDto, SlotDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useEffect, useState } from 'react';
import { searchApi } from '../../api/search';
import { useApi } from '../../api/hooks';
import { Skeleton } from '../../components/ui';
import { dayLabel, formatDate } from '../../lib/format';
import s from './directory.module.css';

// Boş vaxtlar (FR-301-16..21): gün seçimi + saat slotları. Real vaxt yeniləmə — 20 s-dən bir polling (FR-301-19).
// UC-401-də də istifadə olunur (seçilmiş xidmətin müddətinə görə ardıcıl slotlar nəzərə alınır).

export function SlotPicker({
  doctorId,
  clinicId,
  serviceId,
  days = 7,
  selectedSlotId,
  onPick,
  refreshKey,
}: {
  doctorId: string;
  clinicId: string;
  serviceId?: string;
  days?: number;
  selectedSlotId?: string | null;
  onPick: (slot: SlotDto, date: string) => void;
  /** Dəyişəndə slotlar yenidən yüklənir (məs. lock alınmadıqda). */
  refreshKey?: number;
}) {
  const [from, setFrom] = useState<string | undefined>(undefined);
  const q = useApi((sig) => searchApi.slots(doctorId, { clinicId, serviceId, days, from }, sig), [doctorId, clinicId, serviceId, days, from, refreshKey]);
  const [day, setDay] = useState<string | null>(null);

  // Real vaxtda yenilə (başqası slotu tutubsa görünsün).
  useEffect(() => {
    const t = setInterval(q.reload, 20_000);
    return () => clearInterval(t);
  }, [q.reload]);

  const data: DoctorSlotsDto | undefined = q.data;
  useEffect(() => {
    if (!data) return;
    const current = data.days.find((d) => d.date === day);
    if (!current) setDay((data.days.find((d) => d.slots.some((x) => x.available)) ?? data.days[0])?.date ?? null);
  }, [data, day]);

  if (!data) return <Skeleton height={160} />;
  if (!data.acceptingAppointments) return <p className="ink-soft">{t('directory.notAcceptingNow')}</p>;

  const current = data.days.find((d) => d.date === day) ?? data.days[0];
  const anyAvailable = data.days.some((d) => d.slots.some((x) => x.available));

  return (
    <div>
      <div className={s.dayPills} role="group" aria-label={t('directory.dayPick')}>
        {data.days.map((d) => {
          const l = dayLabel(d.date);
          const free = d.slots.filter((x) => x.available).length;
          return (
            <button key={d.date} type="button" className={s.dayPill} aria-pressed={d.date === current?.date} disabled={free === 0} onClick={() => setDay(d.date)}>
              {l.weekday}
              <small>
                {l.date} · {free ? t('directory.freeCount', { n: free }) : t('directory.none')}
              </small>
            </button>
          );
        })}
      </div>

      {!anyAvailable ? (
        <p className="ink-soft" style={{ marginTop: 14 }}>
          {t('directory.noneInDays', { n: days })}
          {data.nextAvailableDate && (
            <>
              {' '}
              {t('directory.nextFree')} <button type="button" className={s.reset} style={{ color: 'var(--accent)' }} onClick={() => setFrom(data.nextAvailableDate!)}>{formatDate(data.nextAvailableDate)}</button>
            </>
          )}
        </p>
      ) : current && current.slots.length === 0 ? (
        <p className="ink-soft" style={{ marginTop: 14 }}>
          {t('directory.noClinicToday')}
        </p>
      ) : (
        <div className={s.slotGrid} role="group" aria-label={t('directory.timePick')}>
          {current?.slots.map((slot) => (
            <button
              key={slot.slotId}
              type="button"
              className={s.slot}
              disabled={!slot.available}
              aria-pressed={selectedSlotId === slot.slotId}
              aria-label={`${slot.startTime}${slot.available ? '' : ` — ${t('directory.busy')}`}`}
              onClick={() => onPick(slot, current.date)}
            >
              {slot.startTime}
            </button>
          ))}
        </div>
      )}
      {from && (
        <button type="button" className={s.reset} style={{ marginTop: 12 }} onClick={() => setFrom(undefined)}>
          {t('directory.backToNear')}
        </button>
      )}
    </div>
  );
}
