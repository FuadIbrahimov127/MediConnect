import { useCallback, useEffect, useState } from 'react';
import { devApi, type PendingSima } from '../api/dev';
import { useToast } from '../components/Toast';
import { formatTime } from '../lib/format';
import s from './DevPanel.module.css';

// SİMA simulyatoru — "telefonla QR skan + üz tanıma" əvəzinə. Mock server SİMA kimi imzalı callback göndərir.

const PURPOSE: Record<string, string> = {
  REGISTRATION: 'Qeydiyyat',
  PIN_RESET: 'PIN bərpası',
  DOCTOR_ONBOARDING: 'Həkim dəvəti',
  CLINIC_ADMIN_ONBOARDING: 'Admin dəvəti',
};

export function SimaSimulator() {
  const toast = useToast();
  const [items, setItems] = useState<PendingSima[]>([]);
  const load = useCallback(() => devApi.simaPending().then(setItems).catch(() => setItems([])), []);

  useEffect(() => {
    void load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [load]);

  const scan = async (qrToken: string, outcome: 'SUCCESS' | 'FAILED' | 'FIN_MISMATCH') => {
    try {
      const r = await devApi.simaScan(qrToken, outcome);
      toast.show(r.sessionStatus === 'SUCCESS' ? 'SİMA: şəxsiyyət təsdiqləndi' : 'SİMA: doğrulama uğursuz', r.failureReason ?? undefined);
    } catch (e) {
      toast.error('SİMA callback alınmadı', (e as Error).message);
    }
    void load();
  };

  return (
    <>
      <p className={s.hint}>Ekrandakı QR kodu "skan edin": nəticəni seçin, SİMA imzalı callback göndərəcək.</p>
      {items.length === 0 && <p className={s.hint}>Gözləyən SİMA sessiyası yoxdur. Qeydiyyat və ya PIN bərpasında QR addımına çatın.</p>}
      {items.map((x) => (
        <div key={x.qrToken} className={s.row} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div className={s.rowMain}>
            <div className={s.role}>{PURPOSE[x.purpose] ?? x.purpose}</div>
            <div className={s.rowTitle}>FIN {x.fin}</div>
            <div className={s.rowSub}>
              {x.mobileNumber} · {formatTime(x.expiresAt)}-dək etibarlı
            </div>
          </div>
          <div className={s.btnRow}>
            <button type="button" className={`${s.btn} ${s.btnAccent}`} onClick={() => void scan(x.qrToken, 'SUCCESS')}>
              Üz tanıma uğurlu
            </button>
            <button type="button" className={s.btn} onClick={() => void scan(x.qrToken, 'FAILED')}>
              Uğursuz
            </button>
            <button type="button" className={`${s.btn} ${s.btnDanger}`} onClick={() => void scan(x.qrToken, 'FIN_MISMATCH')}>
              Başqa şəxs (FIN uyğunsuz)
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
