import { type MedicationInput, type PrescriptionContextDto, type PrescriptionDto, type PrescriptionWarningDto } from '@mediconnect/shared';
import { ALLERGY_SEVERITY_LABEL } from '../../i18n/labels';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '../../api/client';
import { documentsApi } from '../../api/documents';
import { useApi } from '../../api/hooks';
import { prescriptionsApi } from '../../api/prescriptions';
import { Alert, Field, Modal } from '../../components/forms';
import { Button, ButtonLink, EmptyState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { DocumentViewer } from '../../features/documents/DocumentViewer';
import { DrugPicker } from '../../features/prescriptions/DrugPicker';
import { GENDER_LABEL, PrescriptionView } from '../../features/prescriptions/PrescriptionView';
import s from '../../features/prescriptions/prescriptions.module.css';
import { tValidation, t } from '../../i18n';
import { formatDate } from '../../lib/format';

// UC-601 — resept yazma: avtodoldurma və klinik kontekst (FR-601-05, 19, 20), dərman axtarışı və əl ilə daxiletmə,
// hər seçimdən sonra server yoxlaması (allergiya, qarşılıqlı təsir, nəzarətdə olan dərman, yaş), şablon və təkrar,
// qaralama, önizləmə → səbəbli ötürmə → PIN ilə rəqəmsal imza. Bütün qaydalar serverdədir; UI yalnız əks etdirir.

type Row = MedicationInput & { key: string; name: string; isControlled: boolean };

const FREQUENCIES = [t('rxEdit.f1'), t('rxEdit.f2'), t('rxEdit.f3'), t('rxEdit.f4'), t('rxEdit.f5'), t('rxEdit.f6'), t('rxEdit.f7')];
const INSTRUCTIONS = [t('rxEdit.i1'), t('rxEdit.i2'), t('rxEdit.i3'), t('rxEdit.i4'), t('rxEdit.i5')];
const WARN_TITLE: Record<PrescriptionWarningDto['type'], string> = {
  ALLERGY: t('rxEdit.wALLERGY'),
  INTERACTION: t('rxEdit.wINTERACTION'),
  CONTROLLED: t('rxEdit.wCONTROLLED'),
  MANUAL_DRUG: t('rxEdit.wMANUAL_DRUG'),
  AGE: t('rxEdit.wAGE'),
};

let seq = 0;
const toRow = (m: MedicationInput & { name: string; isControlled?: boolean }): Row => ({
  key: `m${++seq}`,
  drugId: m.drugId,
  drugNameManual: m.drugNameManual,
  dosage: m.dosage,
  frequency: m.frequency,
  durationDays: m.durationDays,
  instructions: m.instructions,
  name: m.name,
  isControlled: m.isControlled ?? false,
});
const toInput = ({ drugId, drugNameManual, dosage, frequency, durationDays, instructions }: Row): MedicationInput => ({ drugId, drugNameManual, dosage, frequency, durationDays, instructions });

export function PrescriptionEditorPage() {
  const { appointmentId = '' } = useParams();
  const [params] = useSearchParams();
  const idParam = params.get('id');
  const navigate = useNavigate();
  const [state, setState] = useState<{ p: PrescriptionDto | null; error: ApiClientError | null }>({ p: null, error: null });

  useEffect(() => {
    let alive = true;
    // Server randevu üzrə mövcud qaralamanı qaytarır, ona görə təkrar çağırış yeni qaralama yaratmır.
    (idParam ? prescriptionsApi.get(idParam) : prescriptionsApi.create({ appointmentId }))
      .then((p) => {
        if (!alive) return;
        if (p.status !== 'DRAFT') navigate(`/doctor/prescriptions/${p.prescriptionId}`, { replace: true });
        else setState({ p, error: null });
      })
      .catch((e: ApiClientError) => alive && setState({ p: null, error: e }));
    return () => {
      alive = false;
    };
  }, [appointmentId, idParam, navigate]);

  if (state.error)
    return (
      <div className="card">
        <EmptyState
          title={state.error.errorType === 'LicenseInvalid' ? t('rxEdit.cantWrite') : state.error.errorType === 'NotFound' ? t('apptDetail.notFound') : t('rxEdit.notOpened')}
          body={state.error.message}
          action={<ButtonLink to={`/doctor/appointments/${appointmentId}`}>{t('rxEdit.backAppt')}</ButtonLink>}
        />
      </div>
    );
  if (!state.p) return <Skeleton height={520} radius={18} />;
  return <Editor initial={state.p} />;
}

function Editor({ initial }: { initial: PrescriptionDto }) {
  const toast = useToast();
  const navigate = useNavigate();
  const id = initial.prescriptionId;
  const ctx = useApi((sig) => prescriptionsApi.context(id, sig), [id]);
  const shared = useApi((sig) => documentsApi.doctorShared(initial.patient.patientId, sig), [initial.patient.patientId]);

  const [diagnosis, setDiagnosis] = useState(initial.diagnosis);
  const [icd, setIcd] = useState(initial.icd10Code ?? '');
  const [notes, setNotes] = useState(initial.generalNotes ?? '');
  const [validDays, setValidDays] = useState(initial.validDays);
  const [rows, setRows] = useState<Row[]>(() => initial.medications.map(toRow));
  const [adding, setAdding] = useState(initial.medications.length === 0);
  const [warnings, setWarnings] = useState<PrescriptionWarningDto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<PrescriptionDto | null>(null);
  const [tplOpen, setTplOpen] = useState(false);
  const [viewing, setViewing] = useState<{ id: string; name: string } | null>(null);

  /** Qaralamanı saxlayır və serverdə təhlükəsizlik yoxlamasını aparır (FR-601-21, 23, 25, 28). */
  const sync = async (nextRows = rows) => {
    setSaving(true);
    try {
      const saved = await prescriptionsApi.update(id, {
        diagnosis: diagnosis.trim(),
        icd10Code: icd.trim() || null,
        generalNotes: notes.trim() || null,
        validDays,
        medications: nextRows.map(toInput),
      });
      const check = await prescriptionsApi.check(id);
      setWarnings(check.warnings);
      setErrors({});
      return { saved, check };
    } catch (e) {
      const err = e as ApiClientError;
      if (err.details?.fields) setErrors(err.details.fields);
      toast.error(t('rxEdit.notSaved'), err.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // İlk açılışda mövcud dərmanlar üçün xəbərdarlıqları göstər.
  useEffect(() => {
    if (initial.medications.length) void prescriptionsApi.check(id).then((c) => setWarnings(c.warnings)).catch(() => undefined);
  }, [id, initial.medications.length]);

  const setRow = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const replaceRows = (next: Row[]) => {
    setRows(next);
    void sync(next);
  };

  const applyMeds = (meds: (MedicationInput & { name: string; isControlled?: boolean })[], label: string) => {
    replaceRows(meds.map(toRow));
    setAdding(false);
    toast.success(label, t('rxEdit.filled'));
  };
  const copyPrevious = async (prevId: string) => {
    try {
      const prev = await prescriptionsApi.get(prevId);
      setDiagnosis(prev.diagnosis);
      setIcd(prev.icd10Code ?? '');
      setNotes(prev.generalNotes ?? '');
      applyMeds(prev.medications, t('rxEdit.copied', { n: prev.prescriptionNumber ?? '' }));
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    }
  };

  const reviewAndSign = async () => {
    const r = await sync();
    if (!r) return;
    if (Object.keys(r.check.missingFields).length) {
      setErrors(r.check.missingFields);
      toast.error(t('rxEdit.missing'), t('rxEdit.missingBody'));
      return;
    }
    setPreview(r.saved);
  };

  const saveDraft = async () => {
    if (await sync()) toast.success(t('rxEdit.draftSaved'), t('rxEdit.draftSavedBody'));
  };
  const discard = async () => {
    try {
      await prescriptionsApi.cancel(id, 'Qaralama həkim tərəfindən ləğv edildi');
      toast.success(t('rxEdit.draftCancelled'));
      navigate(`/doctor/appointments/${initial.appointmentId}`);
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    }
  };

  const c = ctx.data;
  const certInvalid = c ? !c.signatureCertificate.valid : false;
  const err = (k: string) => (errors[k] ? tValidation(errors[k]) : undefined);

  return (
    <div>
      <nav style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
        <Link to="/doctor/appointments" style={{ color: 'var(--muted)' }}>
          {t('panel.doctor.appointments')}
        </Link>{' '}
        ·{' '}
        <Link to={`/doctor/appointments/${initial.appointmentId}`} style={{ color: 'var(--muted)' }}>
          {initial.patient.fullName}, {formatDate(initial.appointmentDate)}
        </Link>{' '}
        · {t('docs.tlPRESCRIPTION')}
      </nav>
      <h1 className="page-title">{t('rx.eRx')}</h1>
      {certInvalid && c && (
        <div style={{ marginBottom: 18 }}>
          <Alert tone="error">
            {t('rxEdit.certExpired', { date: c.signatureCertificate.expiryDate ? formatDate(c.signatureCertificate.expiryDate) : '' })}
          </Alert>
        </div>
      )}
      <div className={s.editor}>
        <aside className={s.ctx}>{c ? <ContextPanel c={c} onCopy={(pid) => void copyPrevious(pid)} onTemplate={(tp) => applyMeds(tp.medications, t('rxEdit.templateApplied', { name: tp.name }))} /> : <Skeleton height={320} radius={14} />}
          <div className={s.ctxBlock}>
            <div className={s.ctxTitle}>{t('docAppt.sharedDocs')}</div>
            {!shared.data ? (
              <Skeleton height={40} />
            ) : shared.data.documents.length === 0 ? (
              <span className="muted">{t('shares.empty')}</span>
            ) : (
              <ul className={s.ctxList}>
                {shared.data.documents.map((d) => (
                  <li key={d.grantId}>
                    <span style={{ overflowWrap: 'anywhere' }}>{d.fileName}</span>
                    <button type="button" className={s.linkBtn} onClick={() => setViewing({ id: d.documentId, name: d.fileName })}>
                      {t('docPage.view')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <div className={s.form}>
          <section className={s.section}>
            <h2 className={s.sectionTitle}>{t('rx.diagnosis')}</h2>
            <div className={s.row2}>
              <Field label={t('rx.diagnosis')} htmlFor="dx" error={err('diagnosis')}>
                <input id="dx" className="input" value={diagnosis} maxLength={2000} onChange={(e) => setDiagnosis(e.target.value)} placeholder={t('rxEdit.dxPh')} />
              </Field>
              <Field label={t('rxEdit.icd')} htmlFor="icd" error={err('icd10Code')} hint={t('rxEdit.icdHint')}>
                <input id="icd" className="input" value={icd} maxLength={8} onChange={(e) => setIcd(e.target.value.toUpperCase())} />
              </Field>
            </div>
          </section>

          <section className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>{t('rxEdit.medsTitle')}</h2>
              <div className={s.tplRow}>
                {rows.length > 0 && (
                  <Button size="small" variant="ghost" onClick={() => setTplOpen(true)}>
                    {t('rxEdit.saveTpl')}
                  </Button>
                )}
              </div>
            </div>
            {err('medications') && <Alert tone="error">{t('rxEdit.atLeastOne')}</Alert>}
            {rows.map((r, i) => (
              <div key={r.key} className={s.medEdit}>
                <div className={s.medEditHead}>
                  <span>
                    {i + 1}. {r.name}
                    {r.isControlled && <span className="muted" style={{ fontWeight: 500, fontSize: 13 }}>{t('rxEdit.controlledTag')}</span>}
                  </span>
                  <button type="button" className={s.linkBtn} onClick={() => replaceRows(rows.filter((x) => x.key !== r.key))}>
                    {t('common.delete')}
                  </button>
                </div>
                {warnings
                  .filter((w) => w.medicationIndex === i)
                  .map((w, k) => (
                    <div key={k} className={`${s.warn} ${s[`warn_${w.type === 'ALLERGY' ? 'ALLERGY' : w.severity}`]}`} role={w.requiresOverride ? 'alert' : undefined}>
                      <div className={s.warnTitle}>
                        {WARN_TITLE[w.type]}
                        {w.requiresOverride && t('rxEdit.needsOverride')}
                      </div>
                      {w.message}
                    </div>
                  ))}
                <div className={s.medGrid}>
                  <Field label={t('rxEdit.dose')} htmlFor={`${r.key}-dose`} error={err(`medications.${i}.dosage`)}>
                    <input id={`${r.key}-dose`} className="input" value={r.dosage} maxLength={100} placeholder={t('rxEdit.dosePh')} onChange={(e) => setRow(r.key, { dosage: e.target.value })} />
                  </Field>
                  <Field label={t('rxEdit.freq')} htmlFor={`${r.key}-freq`} error={err(`medications.${i}.frequency`)}>
                    <input id={`${r.key}-freq`} className="input" list="rx-freq" value={r.frequency} maxLength={100} onChange={(e) => setRow(r.key, { frequency: e.target.value })} />
                  </Field>
                  <Field label={t('rxEdit.duration')} htmlFor={`${r.key}-days`}>
                    <input
                      id={`${r.key}-days`}
                      className="input"
                      type="number"
                      min={1}
                      max={365}
                      value={r.durationDays ?? ''}
                      onChange={(e) => setRow(r.key, { durationDays: e.target.value ? Math.max(1, Math.min(365, Number(e.target.value))) : null })}
                    />
                  </Field>
                </div>
                <Field label={t('rxEdit.instructions')} htmlFor={`${r.key}-ins`}>
                  <input id={`${r.key}-ins`} className="input" list="rx-ins" value={r.instructions ?? ''} maxLength={500} onChange={(e) => setRow(r.key, { instructions: e.target.value || null })} />
                </Field>
              </div>
            ))}
            {adding || rows.length === 0 ? (
              <DrugPicker
                autoFocus={rows.length > 0}
                onPick={(d) => {
                  const row =
                    'manual' in d
                      ? toRow({ drugId: null, drugNameManual: d.manual, name: d.manual, dosage: '', frequency: '', durationDays: null, instructions: null })
                      : toRow({ drugId: d.drugId, drugNameManual: null, name: `${d.tradeName}${d.strength ? ` ${d.strength}` : ''}`, isControlled: d.isControlled, dosage: '', frequency: '', durationDays: null, instructions: null });
                  replaceRows([...rows, row]);
                  setAdding(false);
                }}
              />
            ) : (
              <Button variant="secondary" onClick={() => setAdding(true)} disabled={rows.length >= 20}>
                {t('rxEdit.addDrug')}
              </Button>
            )}
            <datalist id="rx-freq">
              {FREQUENCIES.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            <datalist id="rx-ins">
              {INSTRUCTIONS.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>{t('rxEdit.advice')}</h2>
            <Field label={t('rxEdit.notesLabel')} htmlFor="notes">
              <textarea id="notes" className="input" rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <Field label={t('rxEdit.validLabel')} htmlFor="valid" hint={t('rxEdit.validHint', { n: c?.defaultValidDays ?? 30 })}>
              <input id="valid" className="input" type="number" min={1} max={365} style={{ maxWidth: 160 }} value={validDays} onChange={(e) => setValidDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))} />
            </Field>
          </section>

          <div className={s.footerBar}>
            <Button variant="ghost" onClick={() => void discard()}>
              {t('rxEdit.discard')}
            </Button>
            <div className={s.tplRow}>
              <Button variant="secondary" loading={saving && !preview} onClick={() => void saveDraft()}>
                {t('rxEdit.saveDraft')}
              </Button>
              <Button disabled={certInvalid} loading={saving} onClick={() => void reviewAndSign()}>
                {t('rxEdit.checkSign')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {preview && <SignDialog p={preview} warnings={warnings} onClose={() => setPreview(null)} onSigned={(p) => navigate(`/doctor/prescriptions/${p.prescriptionId}`)} />}
      {tplOpen && <TemplateDialog meds={rows.map(toInput)} onClose={() => setTplOpen(false)} onSaved={ctx.reload} />}
      {viewing && <DocumentViewer documentId={viewing.id} title={viewing.name} onClose={() => setViewing(null)} />}
    </div>
  );
}

function ContextPanel({ c, onCopy, onTemplate }: { c: PrescriptionContextDto; onCopy: (id: string) => void; onTemplate: (t: PrescriptionContextDto['templates'][number]) => void }) {
  return (
    <>
      <div className={s.ctxBlock}>
        <div className={s.ctxTitle}>{t('rx.patient')}</div>
        <strong>{c.patient.fullName}</strong>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          FIN {c.patient.fin} · {t('common.age', { n: c.patient.age })} · {GENDER_LABEL[c.patient.gender]}
        </div>
      </div>
      <div className={`${s.ctxBlock} ${c.allergies.length ? s.allergy : ''}`}>
        <div className={s.ctxTitle}>{t('profile.allergies')}</div>
        {c.allergies.length === 0 ? (
          <span className="muted">{t('docAppt.notRecorded')}</span>
        ) : (
          <ul className={s.ctxList}>
            {c.allergies.map((a) => (
              <li key={a.allergenName}>
                <strong>{a.allergenName}</strong>
                <span>{ALLERGY_SEVERITY_LABEL[a.severity]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={s.ctxBlock}>
        <div className={s.ctxTitle}>{t('profile.chronic')}</div>
        {c.chronicConditions.length === 0 ? (
          <span className="muted">{t('rxEdit.none')}</span>
        ) : (
          <ul className={s.ctxList}>
            {c.chronicConditions.map((x) => (
              <li key={x.conditionName}>
                <span>{x.conditionName}</span>
                <span className="muted">{x.icd10Code}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={s.ctxBlock}>
        <div className={s.ctxTitle}>{t('rxEdit.activeMeds')}</div>
        {c.activeMedications.length === 0 ? (
          <span className="muted">{t('rxEdit.none')}</span>
        ) : (
          <ul className={s.ctxList}>
            {c.activeMedications.map((m, i) => (
              <li key={i}>
                <span>{m.name}</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {m.source === 'PATIENT' ? t('rxEdit.byPatient') : t('rxEdit.yourRx')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {c.previousPrescriptions.length > 0 && (
        <div className={s.ctxBlock}>
          <div className={s.ctxTitle}>{t('rxEdit.prevRx')}</div>
          <ul className={s.ctxList}>
            {c.previousPrescriptions.map((p) => (
              <li key={p.prescriptionId}>
                <span>
                  <Link to={`/doctor/prescriptions/${p.prescriptionId}`}>{p.prescriptionNumber}</Link>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {formatDate(p.date)} · {t('acc.medsCount', { n: p.medicationCount })}
                  </div>
                </span>
                <button type="button" className={s.linkBtn} onClick={() => onCopy(p.prescriptionId)}>
                  {t('rxEdit.repeat')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {c.templates.length > 0 && (
        <div className={s.ctxBlock}>
          <div className={s.ctxTitle}>{t('rxEdit.myTemplates')}</div>
          <ul className={s.ctxList}>
            {c.templates.map((tp) => (
              <li key={tp.templateId}>
                <span>
                  {tp.name}
                  <div className="muted" style={{ fontSize: 12 }}>
                    {tp.medications.map((m) => m.name).join(', ')}
                  </div>
                </span>
                <button type="button" className={s.linkBtn} onClick={() => onTemplate(tp)}>
                  {t('rxEdit.apply')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/** FR-601-29 önizləmə → BR-601-09 səbəbli ötürmə → BR-601-08 əsaslandırma → FR-601-31 PIN ilə imza. */
function SignDialog({ p, warnings, onClose, onSigned }: { p: PrescriptionDto; warnings: PrescriptionWarningDto[]; onClose: () => void; onSigned: (p: PrescriptionDto) => void }) {
  const toast = useToast();
  const needOverride = useMemo(() => [...new Set(warnings.filter((w) => w.requiresOverride).map((w) => w.medicationIndex))], [warnings]);
  const controlled = warnings.some((w) => w.type === 'CONTROLLED');
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [justification, setJustification] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ready = pin.length === 4 && (!needOverride.length || (confirmed && needOverride.every((i) => (reasons[i] ?? '').trim().length >= 10))) && (!controlled || justification.trim().length >= 10);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const signed = await prescriptionsApi.sign(p.prescriptionId, {
        confirmationPin: pin,
        overrides: needOverride.map((i) => ({ medicationIndex: i, reason: reasons[i].trim() })),
        controlledJustification: controlled ? justification.trim() : undefined,
      });
      toast.success(t('rxEdit.signed'), t('rxEdit.signedBody', { n: signed.prescriptionNumber ?? '' }));
      onSigned(signed);
    } catch (e) {
      const err = e as ApiClientError;
      setError(err.message);
      if (err.errorType === 'InvalidPin') setPin('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={t('rxEdit.previewTitle')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('rxEdit.backEdit')}
          </Button>
          <Button loading={busy} disabled={!ready} onClick={() => void submit()}>
            {t('rxEdit.sign')}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '62vh', overflowY: 'auto' }}>
        <PrescriptionView p={p} />
        {needOverride.length > 0 && (
          <div className={`${s.warn} ${s.warn_ALLERGY}`}>
            <div className={s.warnTitle}>{t('rxEdit.overrideTitle')}</div>
            {warnings
              .filter((w) => w.requiresOverride)
              .map((w, k) => (
                <div key={k} style={{ marginBottom: 6 }}>
                  • {w.message}
                </div>
              ))}
            {needOverride.map((i) => (
              <Field key={i} label={t('rxEdit.reasonFor', { name: p.medications[i]?.name ?? t('rxEdit.drugN', { n: i + 1 }) })} htmlFor={`ovr-${i}`} hint={t('rxEdit.min10Audit')}>
                <textarea id={`ovr-${i}`} className="input" rows={2} maxLength={500} value={reasons[i] ?? ''} onChange={(e) => setReasons((r) => ({ ...r, [i]: e.target.value }))} />
              </Field>
            ))}
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, marginTop: 6 }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              {t('rxEdit.accept')}
            </label>
          </div>
        )}
        {controlled && (
          <Field label={t('rxEdit.justification')} htmlFor="ctrl" hint={t('rxEdit.min10')}>
            <textarea id="ctrl" className="input" rows={2} maxLength={500} value={justification} onChange={(e) => setJustification(e.target.value)} />
          </Field>
        )}
        <Field label={t('rxEdit.signPin')} htmlFor="sign-pin" hint={t('rxEdit.signPinHint')}>
          <input
            id="sign-pin"
            className="input"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            style={{ maxWidth: 160, letterSpacing: '.4em' }}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && ready && void submit()}
          />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
}

function TemplateDialog({ meds, onClose, onSaved }: { meds: MedicationInput[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await prescriptionsApi.saveTemplate({ name: name.trim(), medications: meds });
      toast.success(t('rxEdit.tplSaved'));
      onSaved();
      onClose();
    } catch (e) {
      toast.error(t('common.failed'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={t('rxEdit.saveTpl')}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={busy} disabled={name.trim().length < 2} onClick={() => void save()}>
            {t('rxEdit.saveShort')}
          </Button>
        </>
      }
    >
      <Field label={t('rxEdit.tplName')} htmlFor="tpl-name" hint={t('rxEdit.tplHint', { n: meds.length })}>
        <input id="tpl-name" className="input" value={name} maxLength={100} autoFocus onChange={(e) => setName(e.target.value)} placeholder={t('rxEdit.tplPh')} />
      </Field>
    </Modal>
  );
}
