import { NOTIFICATION_TYPE, type AdminSettingDto, type AdminTemplateDto } from '@mediconnect/shared';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { ApiClientError } from '../../api/client';
import { useApi } from '../../api/hooks';
import { Alert, Field, Modal } from '../../components/forms';
import { Badge, Button, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { tValidation, t } from '../../i18n';
import { formatDateTime } from '../../lib/format';

// UC-904 — sistem parametrləri (kodda deyil, bazada): kateqoriyalar, diapazon validasiyası (EF-904-1), kritik
// parametrdə əlavə təsdiq + səbəb (EF-904-2), dəyişiklik tarixçəsi, dərhal tətbiq. Bildiriş şablonları — hər dil ayrıca.

const CATEGORY: Record<string, string> = {
  security: t('set.cSecurity'), appointment: t('set.cAppointment'), notification: t('set.cNotification'), review: t('set.cReview'), document: t('set.cDocument'), prescription: t('set.cPrescription'), clinic: t('set.cClinic'),
};
const LANG = { az: 'AZ', ru: 'RU', en: 'EN' } as const;

export function AdminSettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'templates' ? 'templates' : 'settings';
  return (
    <div className={s.stack}>
      <h1 className="page-title" style={{ margin: 0 }}>
        {t('panel.admin.settings')}
      </h1>
      <div className={s.chips} role="tablist">
        <button type="button" role="tab" className={s.chipToggle} aria-pressed={tab === 'settings'} aria-selected={tab === 'settings'} onClick={() => setParams({}, { replace: true })}>
          {t('set.params')}
        </button>
        <button type="button" role="tab" className={s.chipToggle} aria-pressed={tab === 'templates'} aria-selected={tab === 'templates'} onClick={() => setParams({ tab: 'templates' }, { replace: true })}>
          {t('set.templates')}
        </button>
      </div>
      {tab === 'settings' ? <Settings /> : <Templates />}
    </div>
  );
}

function Settings() {
  const q = useApi((sig) => adminApi.settings(sig), []);
  const [editing, setEditing] = useState<AdminSettingDto | null>(null);
  const [history, setHistory] = useState<string | null>(null);
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={420} radius={18} />;
  const data = q.data;
  const cats = [...new Set(data.map((x) => x.category))];
  return (
    <>
      <Alert tone="info">{t('set.instant')}</Alert>
      {cats.map((cat) => (
        <section key={cat} className={s.section}>
          <h2 className={s.sectionTitle}>{CATEGORY[cat] ?? cat}</h2>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>{t('set.param')}</th>
                  <th className={s.num}>{t('set.value')}</th>
                  <th>{t('set.range')}</th>
                  <th>{t('set.lastChange')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data
                  .filter((x) => x.category === cat)
                  .map((x) => (
                    <tr key={x.key}>
                      <td>
                        {x.description} {x.isCritical && <Badge tone="danger">{t('set.critical')}</Badge>}
                        <div className={`${s.sub} mono`}>{x.key}</div>
                      </td>
                      <td className={s.num}>
                        <strong>{x.value}</strong>
                        {x.value !== x.defaultValue && <div className={s.sub}>{t('set.default', { v: x.defaultValue })}</div>}
                      </td>
                      <td className={s.sub}>
                        {x.min}–{x.max}
                      </td>
                      <td className={s.sub}>{x.updatedBy ? `${x.updatedBy}, ${formatDateTime(x.updatedAt)}` : '—'}</td>
                      <td>
                        <div className={s.actions} style={{ flexWrap: 'nowrap' }}>
                          <Button size="small" variant="ghost" onClick={() => setHistory(x.key)}>
                            {t('set.history')}
                          </Button>
                          <Button size="small" onClick={() => setEditing(x)}>
                            {t('profile.change')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {editing && <SettingDialog x={editing} onClose={() => setEditing(null)} onSaved={(d) => (q.setData(d), setEditing(null))} />}
      {history && <HistoryDialog k={history} onClose={() => setHistory(null)} />}
    </>
  );
}

function SettingDialog({ x, onClose, onSaved }: { x: AdminSettingDto; onClose: () => void; onSaved: (d: AdminSettingDto[]) => void }) {
  const toast = useToast();
  const [value, setValue] = useState(String(x.value));
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const n = Number(value);
  const valid = Number.isInteger(n) && n >= x.min && n <= x.max;
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      onSaved(await adminApi.updateSetting(x.key, { value: n, confirm: x.isCritical ? confirm : undefined, reason: reason.trim() || undefined }));
      toast.success(t('set.updated'), t('set.updatedBody'));
    } catch (e) {
      const er = e as ApiClientError;
      setError(er.details?.fields ? Object.values(er.details.fields).map(tValidation).join(' ') : er.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={x.description}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant={x.isCritical ? 'danger' : 'primary'} loading={busy} disabled={!valid || n === x.value || (x.isCritical && (!confirm || reason.trim().length < 5))} onClick={() => void submit()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <Field label={t('set.newValue', { min: x.min, max: x.max })} htmlFor="set-val" error={value && !valid ? t('set.rangeError', { min: x.min, max: x.max }) : undefined}>
        <input id="set-val" className="input" type="number" min={x.min} max={x.max} style={{ maxWidth: 160 }} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
      </Field>
      <Field label={x.isCritical ? t('set.reasonCritical') : t('common.reasonOptional')} htmlFor="set-reason">
        <input id="set-reason" className="input" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
      </Field>
      {x.isCritical && (
        <Alert tone="warning">
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
            {t('set.criticalConfirm')}
          </label>
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
    </Modal>
  );
}

function HistoryDialog({ k, onClose }: { k: string; onClose: () => void }) {
  const q = useApi((sig) => adminApi.settingHistory(k, sig), [k]);
  return (
    <Modal open title={t('set.historyTitle', { k })} onClose={onClose} actions={<Button onClick={onClose}>{t('common.close')}</Button>}>
      {!q.data ? (
        <Skeleton height={80} />
      ) : q.data.length === 0 ? (
        <span className="muted">{t('set.notChanged')}</span>
      ) : (
        <div className={s.list}>
          {q.data.map((h, i) => (
            <div key={i} className={s.row}>
              <span>
                <strong>
                  {h.from} → {h.to}
                </strong>
                {h.reason && <div className={s.sub}>{h.reason}</div>}
              </span>
              <span className={s.sub}>
                {h.by}, {formatDateTime(h.at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function Templates() {
  const q = useApi((sig) => adminApi.templates(sig), []);
  const [type, setType] = useState('');
  const [lang, setLang] = useState('az');
  const [editing, setEditing] = useState<AdminTemplateDto | null>(null);
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={420} radius={18} />;
  const rows = q.data.filter((x) => (!type || x.notificationType === type) && x.languageCode === lang);
  return (
    <>
      <div className={s.toolbar} style={{ marginBottom: 0 }}>
        <label>
          {t('set.notifType')}
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{t('shares.all')}</option>
            {NOTIFICATION_TYPE.map((nt) => (
              <option key={nt} value={nt}>
                {nt}
              </option>
            ))}
          </select>
        </label>
        <div className={s.chips} role="group" aria-label={t('set.language')}>
          {(Object.keys(LANG) as (keyof typeof LANG)[]).map((l) => (
            <button key={l} type="button" className={s.chipToggle} aria-pressed={lang === l} onClick={() => setLang(l)}>
              {LANG[l]}
            </button>
          ))}
        </div>
      </div>
      <Alert tone="info">{t('set.tplInfo', { doctorName: '{doctorName}', date: '{date}' })}</Alert>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>{t('caProf.type')}</th>
              <th>{t('set.channel')}</th>
              <th>{t('set.text')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((tp) => (
              <tr key={tp.templateId}>
                <td className="mono" style={{ fontSize: 12 }}>
                  {tp.notificationType} {!tp.isActive && <Badge tone="warning">{t('cat.inactive')}</Badge>}
                </td>
                <td>{tp.channel}</td>
                <td>
                  {tp.titleTemplate && <strong>{tp.titleTemplate}</strong>}
                  <div className={s.sub} style={{ color: 'var(--ink-soft)' }}>
                    {tp.bodyTemplate}
                  </div>
                </td>
                <td>
                  <Button size="small" variant="ghost" onClick={() => setEditing(tp)}>
                    {t('caSvc.edit')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <TemplateDialog t={editing} onClose={() => setEditing(null)} onSaved={(d) => (q.setData(d), setEditing(null))} />}
    </>
  );
}

function TemplateDialog({ t: tp, onClose, onSaved }: { t: AdminTemplateDto; onClose: () => void; onSaved: (d: AdminTemplateDto[]) => void }) {
  const toast = useToast();
  const [title, setTitle] = useState(tp.titleTemplate ?? '');
  const [body, setBody] = useState(tp.bodyTemplate);
  const [active, setActive] = useState(tp.isActive);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      onSaved(await adminApi.updateTemplate(tp.templateId, { titleTemplate: title.trim() || null, bodyTemplate: body.trim(), isActive: active }));
      toast.success(t('set.tplUpdated'));
    } catch (e) {
      const er = e as ApiClientError;
      setError(er.details?.fields ? Object.values(er.details.fields).join(' ') : er.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={`${tp.notificationType} · ${tp.channel} · ${LANG[tp.languageCode]}`}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={busy} disabled={body.trim().length < 5} onClick={() => void submit()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <Field label={t('set.title')} htmlFor="tpl-title">
        <input id="tpl-title" className="input" value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label={t('set.text')} htmlFor="tpl-body">
        <textarea id="tpl-body" className="input" rows={4} maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        {t('set.tplActive')}
      </label>
      {error && <Alert tone="error">{error}</Alert>}
    </Modal>
  );
}
