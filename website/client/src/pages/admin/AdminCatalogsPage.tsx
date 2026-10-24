import { INTERACTION_SEVERITY, type AdminDrugDto, type CatalogRowDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { INTERACTION_SEVERITY_LABEL } from '../../i18n/labels';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { ApiClientError } from '../../api/client';
import { useApi } from '../../api/hooks';
import { Alert, Field, Modal } from '../../components/forms';
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import s from '../../features/clinicAdmin/clinicAdmin.module.css';
import { formatDate } from '../../lib/format';

// UC-904 alt 1–3 — mərkəzi kataloqlar (BR-904-05): ixtisaslar (axtarış filtrlərinin mənbəyi), xidmətlər (klinikalar
// yalnız buradan seçir) və onlara tələblər, dərmanlar (nəzarətdə olanlar) və qarşılıqlı təsirlər (resept yoxlaması).
// İstifadə olunan element silinmir, deaktiv edilir (BR-904-06, EF-904-3).

const TABS = [
  ['specialties', t('cat.specialties')],
  ['services', t('detail.services')],
  ['requests', t('cat.requests')],
  ['drugs', t('cat.drugs')],
  ['interactions', t('cat.interactions')],
] as const;
type Tab = (typeof TABS)[number][0];

export function AdminCatalogsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'specialties') as Tab;
  return (
    <div className={s.stack}>
      <h1 className="page-title" style={{ margin: 0 }}>
        {t('panel.admin.catalogs')}
      </h1>
      <div className={s.chips} role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} aria-pressed={tab === k} className={s.chipToggle} onClick={() => setParams({ tab: k }, { replace: true })}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'specialties' && <NamedCatalog kind="specialties" />}
      {tab === 'services' && <NamedCatalog kind="services" />}
      {tab === 'requests' && <Requests />}
      {tab === 'drugs' && <Drugs />}
      {tab === 'interactions' && <Interactions />}
    </div>
  );
}

function NamedCatalog({ kind }: { kind: 'specialties' | 'services' }) {
  const toast = useToast();
  const q = useApi((sig) => (kind === 'specialties' ? adminApi.specialties(sig) : adminApi.services(sig)), [kind]);
  const [editing, setEditing] = useState<CatalogRowDto | 'new' | null>(null);
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={320} radius={16} />;
  const save = kind === 'specialties' ? adminApi.saveSpecialty : adminApi.saveService;
  const remove = async (row: CatalogRowDto) => {
    try {
      q.setData(await (kind === 'specialties' ? adminApi.deleteSpecialty(row.id) : adminApi.deleteService(row.id)));
      toast.success(t('cat.deleted'));
    } catch (e) {
      toast.error(t('caSvc.notDeleted'), (e as Error).message);
    }
  };
  const toggle = async (row: CatalogRowDto) => {
    try {
      q.setData(await save(row.id, { nameAz: row.nameAz, isActive: !row.isActive }));
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    }
  };
  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <div className={s.sectionSub}>{kind === 'specialties' ? t('cat.specSub') : t('cat.svcSub')}</div>
        <Button size="small" onClick={() => setEditing('new')}>
          {t('cat.addPlus')}
        </Button>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>{t('cat.nameAz')}</th>
              <th>RU / EN</th>
              {kind === 'services' && <th>{t('cat.category')}</th>}
              <th>{t('cat.usage')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {q.data.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.nameAz}</strong> {!row.isActive && <Badge tone="warning">{t('cat.inactive')}</Badge>}
                </td>
                <td className={s.sub}>{[row.nameRu, row.nameEn].filter(Boolean).join(' / ') || '—'}</td>
                {kind === 'services' && <td>{row.category ?? '—'}</td>}
                <td className={s.sub} title={row.usageDetail.join(', ')}>
                  {row.usage ? `${row.usage}${row.usageDetail.length ? ` · ${row.usageDetail.slice(0, 3).join(', ')}${row.usageDetail.length > 3 ? '…' : ''}` : ''}` : t('cat.unused')}
                </td>
                <td>
                  <div className={s.actions} style={{ flexWrap: 'nowrap' }}>
                    <Button size="small" variant="ghost" onClick={() => setEditing(row)}>
                      {t('caSvc.edit')}
                    </Button>
                    <Button size="small" variant="ghost" onClick={() => void toggle(row)}>
                      {row.isActive ? t('cat.deactivate') : t('caDoc.activate')}
                    </Button>
                    <Button size="small" variant="ghost" disabled={row.usage > 0} title={row.usage ? t('cat.cantDelete') : undefined} onClick={() => void remove(row)}>
                      {t('common.delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <NameDialog kind={kind} row={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={(d) => (q.setData(d), setEditing(null))} />}
    </section>
  );
}

function NameDialog({ kind, row, onClose, onSaved }: { kind: 'specialties' | 'services'; row: CatalogRowDto | null; onClose: () => void; onSaved: (d: CatalogRowDto[]) => void }) {
  const [f, setF] = useState({ nameAz: row?.nameAz ?? '', nameRu: row?.nameRu ?? '', nameEn: row?.nameEn ?? '', category: row?.category ?? '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = { nameAz: f.nameAz.trim(), nameRu: f.nameRu.trim() || null, nameEn: f.nameEn.trim() || null, ...(kind === 'services' ? { category: f.category.trim() || null } : {}) };
      onSaved(await (kind === 'specialties' ? adminApi.saveSpecialty(row?.id ?? null, body) : adminApi.saveService(row?.id ?? null, body)));
    } catch (e) {
      setError((e as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={row ? row.nameAz : kind === 'specialties' ? t('cat.newSpec') : t('cat.newSvc')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={busy} disabled={f.nameAz.trim().length < 2} onClick={() => void submit()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <Field label={t('cat.nameAz')} htmlFor="nm-az">
        <input id="nm-az" className="input" value={f.nameAz} onChange={(e) => setF((x) => ({ ...x, nameAz: e.target.value }))} autoFocus />
      </Field>
      <div className={s.formGrid}>
        <Field label={t('cat.nameRu')} htmlFor="nm-ru">
          <input id="nm-ru" className="input" value={f.nameRu} onChange={(e) => setF((x) => ({ ...x, nameRu: e.target.value }))} />
        </Field>
        <Field label={t('cat.nameEn')} htmlFor="nm-en">
          <input id="nm-en" className="input" value={f.nameEn} onChange={(e) => setF((x) => ({ ...x, nameEn: e.target.value }))} />
        </Field>
      </div>
      {kind === 'services' && (
        <Field label={t('cat.category')} htmlFor="nm-cat" hint={t('cat.catHint')}>
          <input id="nm-cat" className="input" value={f.category} onChange={(e) => setF((x) => ({ ...x, category: e.target.value }))} />
        </Field>
      )}
      {error && <Alert tone="error">{error}</Alert>}
    </Modal>
  );
}

function Requests() {
  const toast = useToast();
  const q = useApi((sig) => adminApi.serviceRequests(sig), []);
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={200} radius={16} />;
  if (!q.data.length)
    return (
      <div className="card">
        <EmptyState title={t('cat.noRequests')} />
      </div>
    );
  const resolve = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      q.setData(await adminApi.resolveServiceRequest(id, { decision }));
      toast.success(decision === 'APPROVE' ? t('cat.addedToCatalog') : t('cat.reqRejected'), t('cat.clinicNotified'));
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    }
  };
  return (
    <div className={s.list}>
      {q.data.map((r) => (
        <div key={r.requestId} className={s.row}>
          <span>
            <strong>{r.name}</strong> <span className={s.sub}>{r.category ?? ''}</span>
            <div className={s.sub}>
              {r.clinicName} · {formatDate(r.createdAt)}
              {r.note && ` · “${r.note}”`}
            </div>
          </span>
          {r.status === 'PENDING' ? (
            <span className={s.actions}>
              <Button size="small" variant="ghost" onClick={() => void resolve(r.requestId, 'REJECT')}>
                {t('docAppt.reject')}
              </Button>
              <Button size="small" onClick={() => void resolve(r.requestId, 'APPROVE')}>
                {t('cat.addToCatalog')}
              </Button>
            </span>
          ) : (
            <Badge tone={r.status === 'APPROVED' ? 'success' : 'danger'}>{r.status === 'APPROVED' ? t('caSvc.reqApproved') : t('caSvc.reqRejected')}</Badge>
          )}
        </div>
      ))}
    </div>
  );
}

function Drugs() {
  const [text, setText] = useState('');
  const q = useApi((sig) => adminApi.drugs(text, sig), [text]);
  const [editing, setEditing] = useState<AdminDrugDto | 'new' | null>(null);
  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <input className="input" type="search" style={{ maxWidth: 320 }} placeholder={t('cat.drugSearchPh')} value={text} onChange={(e) => setText(e.target.value)} aria-label={t('cat.drugSearch')} />
        <Button size="small" onClick={() => setEditing('new')}>
          {t('cat.addDrug')}
        </Button>
      </div>
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={300} radius={16} />}
      {q.data && (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>{t('rx.drug')}</th>
                <th>{t('cat.group')}</th>
                <th>{t('cat.form')}</th>
                <th className={s.num}>{t('cat.inRx')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {q.data.map((d) => (
                <tr key={d.drugId}>
                  <td>
                    <strong>
                      {d.tradeName} {d.strength}
                    </strong>{' '}
                    {d.isControlled && <Badge tone="danger">{t('rx.controlledShort')}</Badge>} {!d.isActive && <Badge tone="warning">{t('cat.inactive')}</Badge>}
                    <div className={s.sub}>{d.genericName}</div>
                  </td>
                  <td>{d.drugClass ?? '—'}</td>
                  <td>{d.form ?? '—'}</td>
                  <td className={s.num}>{d.usage}</td>
                  <td>
                    <Button size="small" variant="ghost" onClick={() => setEditing(d)}>
                      {t('caSvc.edit')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <DrugDialog d={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), q.reload())} />}
    </section>
  );
}

function DrugDialog({ d, onClose, onSaved }: { d: AdminDrugDto | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    tradeName: d?.tradeName ?? '', genericName: d?.genericName ?? '', drugClass: d?.drugClass ?? '', form: d?.form ?? '', strength: d?.strength ?? '',
    patientInfo: d?.patientInfo ?? '', isControlled: d?.isControlled ?? false, isActive: d?.isActive ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const txt = (k: 'tradeName' | 'genericName' | 'drugClass' | 'form' | 'strength' | 'patientInfo') => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const nul = (v: string) => v.trim() || null;
      await adminApi.saveDrug(d?.drugId ?? null, {
        tradeName: f.tradeName.trim(), genericName: nul(f.genericName), drugClass: nul(f.drugClass), form: nul(f.form), strength: nul(f.strength), patientInfo: nul(f.patientInfo),
        isControlled: f.isControlled, isActive: f.isActive,
      });
      toast.success(t('cat.drugUpdated'), t('cat.drugUpdatedBody'));
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={d ? `${d.tradeName} ${d.strength ?? ''}` : t('cat.newDrug')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={busy} disabled={f.tradeName.trim().length < 2} onClick={() => void submit()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className={s.formGrid}>
        <Field label={t('cat.tradeName')} htmlFor="dr-trade">
          <input id="dr-trade" className="input" value={f.tradeName} onChange={txt('tradeName')} />
        </Field>
        <Field label={t('cat.genericName')} htmlFor="dr-gen">
          <input id="dr-gen" className="input" value={f.genericName} onChange={txt('genericName')} />
        </Field>
        <Field label={t('cat.groupAllergy')} htmlFor="dr-class" hint={t('cat.groupHint')}>
          <input id="dr-class" className="input" value={f.drugClass} onChange={txt('drugClass')} />
        </Field>
        <Field label={t('cat.form')} htmlFor="dr-form">
          <input id="dr-form" className="input" value={f.form} onChange={txt('form')} placeholder={t('cat.formPh')} />
        </Field>
        <Field label={t('rxEdit.dose')} htmlFor="dr-str">
          <input id="dr-str" className="input" value={f.strength} onChange={txt('strength')} placeholder={t('cat.dosePh')} />
        </Field>
      </div>
      <Field label={t('cat.patientInfo')} htmlFor="dr-info">
        <textarea id="dr-info" className="input" rows={3} maxLength={1000} value={f.patientInfo} onChange={txt('patientInfo')} />
      </Field>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
        <input type="checkbox" checked={f.isControlled} onChange={(e) => setF((x) => ({ ...x, isControlled: e.target.checked }))} />
        {t('cat.controlledCheck')}
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
        <input type="checkbox" checked={f.isActive} onChange={(e) => setF((x) => ({ ...x, isActive: e.target.checked }))} />
        {t('cat.activeCheck')}
      </label>
      {error && <Alert tone="error">{error}</Alert>}
    </Modal>
  );
}

function Interactions() {
  const toast = useToast();
  const q = useApi((sig) => adminApi.interactions(sig), []);
  const drugs = useApi((sig) => adminApi.drugs('', sig), []);
  const [f, setF] = useState({ drugId1: '', drugId2: '', severity: 'MODERATE', description: '' });
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    try {
      q.setData(await adminApi.addInteraction(f));
      setF({ drugId1: '', drugId2: '', severity: 'MODERATE', description: '' });
      toast.success(t('cat.ixAdded'));
    } catch (e) {
      toast.error(t('sched.notAdded'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className={s.section}>
      <div className={s.formGrid}>
        <Field label={t('cat.drug1')} htmlFor="ix-1">
          <select id="ix-1" className="input" value={f.drugId1} onChange={(e) => setF((x) => ({ ...x, drugId1: e.target.value }))}>
            <option value="">{t('stars.choose')}</option>
            {drugs.data?.map((d) => (
              <option key={d.drugId} value={d.drugId}>
                {d.tradeName} {d.strength}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('cat.drug2')} htmlFor="ix-2">
          <select id="ix-2" className="input" value={f.drugId2} onChange={(e) => setF((x) => ({ ...x, drugId2: e.target.value }))}>
            <option value="">{t('stars.choose')}</option>
            {drugs.data?.map((d) => (
              <option key={d.drugId} value={d.drugId}>
                {d.tradeName} {d.strength}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('profile.severity')} htmlFor="ix-sev" hint={t('cat.severeHint')}>
          <select id="ix-sev" className="input" value={f.severity} onChange={(e) => setF((x) => ({ ...x, severity: e.target.value }))}>
            {INTERACTION_SEVERITY.map((x) => (
              <option key={x} value={x}>
                {INTERACTION_SEVERITY_LABEL[x]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('cat.ixDesc')} htmlFor="ix-desc">
          <input id="ix-desc" className="input" value={f.description} maxLength={500} onChange={(e) => setF((x) => ({ ...x, description: e.target.value }))} />
        </Field>
      </div>
      <div className={s.actions}>
        <Button loading={busy} disabled={!f.drugId1 || !f.drugId2 || f.description.trim().length < 5} onClick={() => void add()}>
          {t('common.add')}
        </Button>
      </div>
      {q.error && <ErrorState message={q.error.message} onRetry={q.reload} />}
      {!q.data && !q.error && <Skeleton height={240} radius={16} />}
      {q.data && (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>{t('cat.pair')}</th>
                <th>{t('profile.severity')}</th>
                <th>{t('cat.explanation')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {q.data.map((i) => (
                <tr key={i.interactionId}>
                  <td>
                    <strong>
                      {i.drug1} + {i.drug2}
                    </strong>
                  </td>
                  <td>
                    <Badge tone={i.severity === 'SEVERE' ? 'danger' : i.severity === 'MODERATE' ? 'warning' : 'neutral'}>{INTERACTION_SEVERITY_LABEL[i.severity]}</Badge>
                  </td>
                  <td className={s.sub} style={{ color: 'var(--ink-soft)' }}>
                    {i.description}
                  </td>
                  <td>
                    <Button size="small" variant="ghost" onClick={() => void adminApi.deleteInteraction(i.interactionId).then(q.setData).catch((e: Error) => toast.error(t('common.failed'), e.message))}>
                      {t('common.delete')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
