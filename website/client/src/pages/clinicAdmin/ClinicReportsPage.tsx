import { REPORT_TYPES, type ReportDto, type ReportType } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clinicAdminApi } from '../../api/clinicAdmin';
import { serverNow } from '../../api/client';
import { useApi } from '../../api/hooks';
import { Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { BarChart, shortDate } from '../../features/charts/BarChart';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import r from '../../features/clinicAdmin/reports.module.css';
import { bakuDateKey, dayShort, formatDate } from '../../lib/format';

// UC-805 alt 1–5 — hesabatlar: gündəlik icmal, həkim üzrə statistika, no-show analizi, yük analizi; CSV (Excel) və PDF.
// Qrafiklər bir rəngli (magnitude) — leqenda tələb olunmur; hər qrafikin cədvəl görünüşü var.

const TITLES: Record<ReportType, string> = { daily: t('rep.daily'), doctors: t('rep.doctors'), 'no-show': t('rep.noShow'), load: t('rep.load') };
const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const pct = (v: number | null) => (v == null ? '—' : `${v}%`);

export function ClinicReportsPage() {
  const toast = useToast();
  const today = bakuDateKey(new Date(serverNow()));
  const [params, setParams] = useSearchParams();
  const type = ((REPORT_TYPES as readonly string[]).includes(params.get('type') ?? '') ? params.get('type') : 'daily') as ReportType;
  const from = params.get('from') ?? addDays(today, -29);
  const to = params.get('to') ?? today;
  const set = (patch: Record<string, string>) => setParams({ type, from, to, ...patch }, { replace: true });
  const q = useApi((sig) => clinicAdminApi.report(type, from, to, sig), [type, from, to]);

  const exp = async (format: 'csv' | 'pdf') => {
    try {
      await clinicAdminApi.exportReport(type, from, to, format);
    } catch (e) {
      toast.error(t('rep.notDownloaded'), (e as Error).message);
    }
  };

  return (
    <div className={s.stack}>
      <div className={s.sectionHead}>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('panel.clinicAdmin.reports')}
        </h1>
        <div className={s.actions}>
          <Button size="small" variant="ghost" onClick={() => void exp('csv')}>
            Excel (CSV)
          </Button>
          <Button size="small" variant="ghost" onClick={() => void exp('pdf')}>
            PDF
          </Button>
        </div>
      </div>
      <div className={s.toolbar} style={{ marginBottom: 0 }}>
        <div className={s.chips} role="tablist" aria-label={t('rep.type')}>
          {REPORT_TYPES.map((k) => (
            <button key={k} type="button" role="tab" aria-selected={type === k} className={s.chipToggle} aria-pressed={type === k} onClick={() => set({ type: k })}>
              {TITLES[k]}
            </button>
          ))}
        </div>
        <label>
          {t('caAppt.from')}
          <input type="date" className="input" value={from} max={to} onChange={(e) => e.target.value && set({ from: e.target.value })} />
        </label>
        <label>
          {t('caAppt.to')}
          <input type="date" className="input" value={to} min={from} onChange={(e) => e.target.value && set({ to: e.target.value })} />
        </label>
        <div className={s.chips}>
          {(
            [
              [t('rep.d7'), 6],
              [t('rep.d30'), 29],
              [t('rep.d90'), 89],
            ] as const
          ).map(([label, n]) => (
            <button key={label} type="button" className={s.chipToggle} aria-pressed={to === today && from === addDays(today, -n)} onClick={() => set({ from: addDays(today, -n), to: today })}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={360} radius={18} />}
      {q.data && <Report d={q.data} />}
    </div>
  );
}

function Report({ d }: { d: ReportDto }) {
  const tot = d.totals;
  if (tot.total === 0 && d.type !== 'daily')
    return (
      <div className="card">
        <EmptyState title={t('rep.noData')} body={t('rep.widen')} />
      </div>
    );
  return (
    <>
      <div className={s.stats}>
        {(
          [
            [t('rep.appts'), String(tot.total)],
            [t('ca.done'), String(tot.completed)],
            [t('ca.cancelled'), String(tot.cancelled)],
            [t('ca.noShow'), String(tot.noShow)],
            [t('rep.completion'), pct(tot.completionRate)],
            ['No-show', pct(tot.noShowRate)],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className={s.stat}>
            <div className={s.statValue}>{v}</div>
            <div className={s.statLabel}>{k}</div>
          </div>
        ))}
      </div>
      {d.daily && <Daily rows={d.daily} />}
      {d.doctors && <Doctors rows={d.doctors} />}
      {d.noShows && <NoShows rows={d.noShows} />}
      {d.load && <Load cells={d.load} />}
    </>
  );
}

/** Günlər üzrə ümumi randevu sayı — bir seriya, bir rəng; hover tooltip + cədvəl görünüşü. */
function Daily({ rows }: { rows: NonNullable<ReportDto['daily']> }) {
  const [table, setTable] = useState(false);
  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <div>
          <h2 className={s.sectionTitle}>{t('rep.byDay')}</h2>
          <div className={s.sectionSub}>{t('rep.byDaySub')}</div>
        </div>
        <Button size="small" variant="ghost" onClick={() => setTable((x) => !x)}>
          {table ? t('rep.chart') : t('rep.table')}
        </Button>
      </div>
      {table ? (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>{t('booking.date')}</th>
                <th className={s.num}>{t('rep.total')}</th>
                <th className={s.num}>{t('rep.confirmed')}</th>
                <th className={s.num}>{t('ca.done')}</th>
                <th className={s.num}>{t('apptDetail.cancellation')}</th>
                <th className={s.num}>{t('ca.noShow')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.date}>
                  <td>{formatDate(x.date)}</td>
                  <td className={s.num}>{x.total}</td>
                  <td className={s.num}>{x.confirmed}</td>
                  <td className={s.num}>{x.completed}</td>
                  <td className={s.num}>{x.cancelled}</td>
                  <td className={s.num}>{x.noShow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <BarChart
          ariaLabel={t('rep.chartAria', { n: Math.max(0, ...rows.map((x) => x.total)) })}
          bars={rows.map((x) => ({
            key: x.date,
            label: shortDate(x.date),
            value: x.total,
            tip: (
              <>
                <strong>{formatDate(x.date)}</strong>
                <div>{t('rep.tipTotal', { n: x.total })}</div>
                <div>{t('rep.tipDone', { n: x.completed })}</div>
                <div>{t('rep.tipCancelled', { n: x.cancelled })}</div>
                <div>{t('rep.tipNoShow', { n: x.noShow })}</div>
              </>
            ),
          }))}
        />
      )}
    </section>
  );
}

function Doctors({ rows }: { rows: NonNullable<ReportDto['doctors']> }) {
  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>{t('rep.doctorStats')}</h2>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>{t('booking.doctor')}</th>
              <th className={s.num}>{t('rep.appts')}</th>
              <th className={s.num}>{t('ca.done')}</th>
              <th className={s.num}>{t('ca.noShow')}</th>
              <th className={s.num}>{t('rep.completion')}</th>
              <th className={s.num}>No-show</th>
              <th className={s.num}>{t('ca.rating')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.doctorId}>
                <td>{x.fullName}</td>
                <td className={s.num}>{x.total}</td>
                <td className={s.num}>{x.completed}</td>
                <td className={s.num}>{x.noShow}</td>
                <td className={s.num}>{pct(x.completionRate)}</td>
                <td className={s.num}>{pct(x.noShowRate)}</td>
                <td className={s.num}>{x.avgRating?.toFixed(1) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NoShows({ rows }: { rows: NonNullable<ReportDto['noShows']> }) {
  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>{t('rep.noShowPatients')}</h2>
      {rows.length === 0 ? (
        <EmptyState title={t('rep.noNoShows')} />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>{t('caAppt.number')}</th>
                <th>{t('booking.date')}</th>
                <th>{t('rx.patient')}</th>
                <th>{t('booking.doctor')}</th>
                <th>{t('booking.stepService')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.appointmentId}>
                  <td className="mono">{x.bookingReference}</td>
                  <td>
                    {formatDate(x.date)}, {x.time}
                  </td>
                  <td>{x.patientName}</td>
                  <td>{x.doctorName}</td>
                  <td>{x.serviceName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Gün × saat sıxlığı — ardıcıl (sequential) bir rəngli şkala: açıqdan tünd. Hüceyrədə say yazılır (rəng tək deyil). */
function Load({ cells }: { cells: NonNullable<ReportDto['load']> }) {
  const hours = cells.length ? Array.from({ length: Math.max(...cells.map((c) => c.hour)) - Math.min(...cells.map((c) => c.hour)) + 1 }, (_, i) => Math.min(...cells.map((c) => c.hour)) + i) : [];
  const max = Math.max(1, ...cells.map((c) => c.count));
  const at = (dow: number, h: number) => cells.find((c) => c.dayOfWeek === dow && c.hour === h)?.count ?? 0;
  if (!cells.length) return <EmptyState title={t('rep.noLoad')} />;
  return (
    <section className={s.section}>
      <div>
        <h2 className={s.sectionTitle}>{t('rep.loadTitle')}</h2>
        <div className={s.sectionSub}>{t('rep.loadSub')}</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className={r.heat}>
          <thead>
            <tr>
              <th />
              {hours.map((h) => (
                <th key={h} scope="col">
                  {String(h).padStart(2, '0')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7].map((dow) => (
              <tr key={dow}>
                <th scope="row">{dayShort(dow)}</th>
                {hours.map((h) => {
                  const n = at(dow, h);
                  // 5 addımlı ardıcıl şkala: accent rəngi səthə qarışdırılır — hər iki tema üçün işləyir.
                  const step = n === 0 ? 0 : Math.ceil((n / max) * 5);
                  return (
                    <td key={h} title={t('rep.cellTip', { day: dayShort(dow), hour: String(h).padStart(2, '0'), n })} className={r[`h${step}`]}>
                      {n || ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={r.scale} aria-hidden="true">
        {t('rep.few')}
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={r[`h${i}`]} />
        ))}
        {t('rep.many')}
      </div>
    </section>
  );
}
