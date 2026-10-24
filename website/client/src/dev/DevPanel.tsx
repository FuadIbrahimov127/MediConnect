import type { DevStateDto, DevUserDto, OutboxMessageDto } from '@mediconnect/shared';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { devApi } from '../api/dev';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { formatDateTime } from '../lib/format';
import { t } from '../i18n';
import { SimaSimulator } from './SimaSimulator';
import s from './DevPanel.module.css';

// Lokal nümayiş alətləri (mock-backend.md → "Dev endpoint-ləri"). Real backenddə göstərilmir.

type Tab = 'roles' | 'messages' | 'sima' | 'clock' | 'faults' | 'data';
const TABS: { id: Tab; label: Parameters<typeof t>[0] }[] = [
  { id: 'roles', label: 'dev.tabRoles' },
  { id: 'messages', label: 'dev.tabMessages' },
  { id: 'sima', label: 'dev.tabSima' },
  { id: 'clock', label: 'dev.tabClock' },
  { id: 'faults', label: 'dev.tabFaults' },
  { id: 'data', label: 'dev.tabData' },
];
const TAB_KEY = 'mc.dev.tab';
const ROLE_LABEL = { SUPER_ADMIN: 'Super admin', CLINIC_ADMIN: 'Klinika admini', DOCTOR: 'Həkim', PATIENT: 'Pasient' } as const;
const FAULT_LABELS: Record<string, string> = { sima: 'SİMA', sms: 'SMS Gateway', push: 'Push servisi', email: 'Email servisi', signature: 'Rəqəmsal imza', storage: 'Fayl storage', antivirus: 'Antivirus' };

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTabState] = useState<Tab>(() => {
    try {
      return (localStorage.getItem(TAB_KEY) as Tab) || 'roles';
    } catch {
      return 'roles';
    }
  });
  const [state, setState] = useState<DevStateDto | null>(null);
  const setTab = (next: Tab) => {
    setTabState(next);
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {
      /* yaddaş əlçatmaz */
    }
  };

  const loadState = useCallback(() => devApi.state().then(setState).catch(() => setState(null)), []);
  useEffect(() => {
    if (open) void loadState();
  }, [open, tab, loadState]);

  return (
    <>
      <button type="button" className={s.fab} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mc-dev-panel">
        <span className={s.tag}>{t('dev.badge')}</span>
        {t('dev.title')}
      </button>
      {open && (
        <section id="mc-dev-panel" className={s.panel} aria-label={t('dev.title')}>
          <div className={s.head}>
            <div className={s.headTitle}>
              <span className={s.tag}>{t('dev.badge')}</span> {t('dev.title')}
            </div>
            <span className={s.clock} title="Mock serverin saatı (Bakı)">
              {state ? `${formatDateTime(state.now)}${state.offsetMinutes ? ` (${state.offsetMinutes > 0 ? '+' : ''}${formatOffset(state.offsetMinutes)})` : ''}` : 'server əlçatan deyil'}
            </span>
          </div>
          <div className={s.tabs} role="tablist">
            {TABS.map((x) => (
              <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} className={`${s.tab} ${tab === x.id ? s.tabActive : ''}`} onClick={() => setTab(x.id)}>
                {t(x.label)}
              </button>
            ))}
          </div>
          <div className={s.body}>
            {tab === 'roles' && <RolesTab />}
            {tab === 'messages' && <MessagesTab />}
            {tab === 'sima' && <SimaSimulator />}
            {tab === 'clock' && <ClockTab onChange={loadState} />}
            {tab === 'faults' && <FaultsTab state={state} onChange={loadState} />}
            {tab === 'data' && <DataTab state={state} onChange={loadState} />}
          </div>
        </section>
      )}
    </>
  );
}

function formatOffset(min: number) {
  const a = Math.abs(min);
  const d = Math.floor(a / 1440);
  const h = Math.floor((a % 1440) / 60);
  const m = a % 60;
  return [d && `${d}g`, h && `${h}s`, m && `${m}d`].filter(Boolean).join(' ') || '0';
}

function RolesTab() {
  const [users, setUsers] = useState<DevUserDto[]>([]);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  useEffect(() => {
    devApi.users().then(setUsers).catch(() => setUsers([]));
  }, []);

  const loginAs = async (u: DevUserDto) => {
    const res = await devApi.loginAs(u.userId);
    signIn(res);
    toast.success(`${u.fullName} kimi daxil oldunuz`, ROLE_LABEL[u.role]);
    navigate(res.redirectTo);
  };

  return (
    <>
      <p className={s.hint}>Bir kliklə istənilən rolla daxil olun. Adi giriş üçün telefon + PIN istifadə edin.</p>
      {users.map((u) => (
        <div key={u.userId} className={s.row}>
          <div className={s.rowMain}>
            <div className={s.role}>{ROLE_LABEL[u.role]}</div>
            <div className={s.rowTitle}>{u.fullName}</div>
            <div className={s.rowSub}>
              {u.mobileNumber} · PIN {u.pin}
            </div>
            <div className={s.rowSub}>{u.description}</div>
          </div>
          <button type="button" className={`${s.btn} ${user?.userId === u.userId ? '' : s.btnAccent}`} onClick={() => void loginAs(u)} disabled={user?.userId === u.userId}>
            {user?.userId === u.userId ? 'Aktiv' : 'Daxil ol'}
          </button>
        </div>
      ))}
    </>
  );
}

function MessagesTab() {
  const [items, setItems] = useState<OutboxMessageDto[]>([]);
  const [channel, setChannel] = useState<'SMS' | 'PUSH' | 'EMAIL' | undefined>(undefined);
  const load = useCallback(() => devApi.outbox(channel).then(setItems).catch(() => setItems([])), [channel]);
  useEffect(() => {
    void load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <>
      <p className={s.hint}>Mock SMS / push / email qutusu. OTP kodları burada görünür (real SMS göndərilmir).</p>
      <div className={s.seg} role="group" aria-label="Kanal">
        {([undefined, 'SMS', 'PUSH', 'EMAIL'] as const).map((c) => (
          <button key={c ?? 'all'} type="button" aria-pressed={channel === c} onClick={() => setChannel(c)}>
            {c ?? 'Hamısı'}
          </button>
        ))}
      </div>
      {items.length === 0 && <p className={s.hint}>Hələ mesaj yoxdur.</p>}
      {items.map((m) => {
        const otp = /\b(\d{6})\b/.exec(m.body)?.[1];
        return (
          <div key={m.id} className={s.row} style={{ alignItems: 'flex-start' }}>
            <div className={s.rowMain}>
              <div className={s.rowSub}>
                {m.channel} → {m.to} · {formatDateTime(m.createdAt)}
              </div>
              {m.title && <div className={s.rowTitle}>{m.title}</div>}
              {otp && <div className={s.code}>{otp}</div>}
              <div className={s.rowBody}>{m.body}</div>
            </div>
            <span className={`${s.status} ${m.status === 'FAILED' ? s.statusBad : s.statusOk}`}>{m.status}</span>
          </div>
        );
      })}
    </>
  );
}

function ClockTab({ onChange }: { onChange: () => void }) {
  const toast = useToast();
  const advance = async (minutes: number, label: string) => {
    const r = await devApi.advanceClock(minutes);
    toast.show(`Saat irəli çəkildi: ${label}`, `Server vaxtı: ${formatDateTime(r.now)}`);
    onChange();
  };
  return (
    <>
      <p className={s.hint}>
        Mock serverin saatını irəli çəkin — xatırlatmalar, avtomatik tamamlanma, icazə və reseptin bitməsi dərhal işlənir. Brauzer saatı dəyişmir.
      </p>
      <div className={s.btnRow}>
        <button type="button" className={s.btn} onClick={() => void advance(15, '+15 dəqiqə')}>+15 dəq</button>
        <button type="button" className={s.btn} onClick={() => void advance(60, '+1 saat')}>+1 saat</button>
        <button type="button" className={s.btn} onClick={() => void advance(22 * 60, '+22 saat')}>+22 saat</button>
        <button type="button" className={s.btn} onClick={() => void advance(24 * 60, '+1 gün')}>+1 gün</button>
        <button type="button" className={s.btn} onClick={() => void advance(7 * 24 * 60, '+7 gün')}>+7 gün</button>
        <button type="button" className={s.btn} onClick={() => void advance(31 * 24 * 60, '+31 gün')}>+31 gün</button>
      </div>
      <div className={s.btnRow}>
        <button
          type="button"
          className={s.btn}
          onClick={async () => {
            const r = await devApi.runJobs();
            toast.show('Job-lar işə salındı', Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(', '));
          }}
        >
          Job-ları indi işlət
        </button>
        <button
          type="button"
          className={`${s.btn} ${s.btnDanger}`}
          onClick={async () => {
            await devApi.resetClock();
            onChange();
          }}
        >
          Real vaxta qayıt
        </button>
      </div>
    </>
  );
}

function FaultsTab({ state, onChange }: { state: DevStateDto | null; onChange: () => void }) {
  if (!state) return <p className={s.hint}>Mock server əlçatan deyil.</p>;
  return (
    <>
      <p className={s.hint}>Xarici servisi "söndürüb" xəta ssenarilərini göstərin (məs. EF-101-5 "SİMA əlçatan deyil", EF-1001-1 SMS fallback).</p>
      {Object.entries(state.faults).map(([target, mode]) => (
        <div key={target} className={s.row}>
          <div className={s.rowTitle}>{FAULT_LABELS[target] ?? target}</div>
          <div className={s.seg} role="group" aria-label={FAULT_LABELS[target]}>
            {(['ok', 'down', 'error'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={async () => {
                  await devApi.setFault(target, m);
                  onChange();
                }}
              >
                {m === 'ok' ? 'İşləyir' : m === 'down' ? 'Əlçatmaz' : 'Xəta'}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function DataTab({ state, onChange }: { state: DevStateDto | null; onChange: () => void }) {
  const toast = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const main = ['users', 'clinics', 'doctors', 'appointments', 'medical_documents', 'prescriptions', 'reviews', 'notifications', 'audit_logs', 'security_events'];
  return (
    <>
      <p className={s.hint}>Store data/db.json-da saxlanılır. Sıfırlama bütün dəyişiklikləri silib demo datanı yenidən yaradır.</p>
      {state && (
        <div className={s.row} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {main.map((k) => (
            <div key={k} className={s.rowSub}>
              {k}: <strong style={{ color: '#EDEFEC' }}>{state.counts[k] ?? 0}</strong>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        className={`${s.btn} ${s.btnDanger}`}
        onClick={async () => {
          if (!window.confirm('Bütün demo data sıfırlansın?')) return;
          await devApi.reset();
          await signOut();
          toast.success('Data sıfırlandı', 'Demo vəziyyəti yenidən yaradıldı.');
          onChange();
          navigate('/');
        }}
      >
        Demo datanı sıfırla
      </button>
    </>
  );
}
