import { useState, type ReactNode } from 'react';
import r from '../clinicAdmin/reports.module.css';

// Bir seriyalı sütun qrafiki (magnitude): nazik sütunlar, 4px yuvarlaq uc, 2px boşluq, səssiz tor, hover/fokus tooltip.
// Bir seriya olduğu üçün leqenda yoxdur — başlıq seriyanı adlandırır. Cədvəl görünüşünü çağıran səhifə verir.

export interface Bar {
  key: string;
  /** X oxunda göstərilən qısa etiket (seyrəldilir). */
  label: string;
  value: number;
  tip: ReactNode;
}

export function BarChart({ bars, ariaLabel, height = 240 }: { bars: Bar[]; ariaLabel: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...bars.map((b) => b.value));
  const ticks = [...new Set([0, Math.round(max / 2), max])];
  const every = Math.ceil(bars.length / 8);
  return (
    <div className={r.chart} style={{ height }} role="img" aria-label={ariaLabel}>
      <div className={r.yAxis}>
        {[...ticks].reverse().map((v) => (
          <span key={v}>{v}</span>
        ))}
      </div>
      <div className={r.plot}>
        <div className={r.bars}>
          {ticks.map((v) => (
            <div key={v} className={r.grid} style={{ bottom: `${(v / max) * 100}%` }} />
          ))}
          {bars.map((b, i) => (
            <div key={b.key} className={r.barSlot} tabIndex={0} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
              <div className={`${r.bar} ${hover === i ? r.barActive : ''}`} style={{ height: `${(b.value / max) * 100}%` }} />
              {hover === i && (
                <div className={r.tip} style={i > bars.length * 0.7 ? { right: 0 } : { left: 0 }}>
                  {b.tip}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className={r.xAxis}>
          {bars.map((b, i) => (
            <span key={b.key}>{i % every === 0 ? b.label : ''}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** "2026-10-23" → "23.10" */
export const shortDate = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`;
