import type { AutocompleteItemDto, ClinicSearchResultDto, DoctorSearchResultDto, FacetDto } from '@mediconnect/shared';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { catalogApi } from '../../api/endpoints';
import { useApi } from '../../api/hooks';
import { searchApi } from '../../api/search';
import { Button, ErrorState, Skeleton } from '../../components/ui';
import { clinicTypeLabel, ClinicCard, DoctorCard, LANGUAGE_CODES, languageLabel } from '../../features/directory/cards';
import { QueryInput, rememberSearch } from '../../features/directory/QueryInput';
import s from '../../features/directory/directory.module.css';
import { t } from '../../i18n';

// UC-201 / UC-202 — axtarış səhifəsi: rejim seçicisi [Həkim]/[Klinika] (FR-201-01..03), filtrlər URL-də (BR-201-07),
// aktiv filtrlər chip kimi (FR-201-19), bir kliklə sıfırlama (FR-201-20), çeşidləmə, səhifələmə (max 20).

type Mode = 'DOCTOR' | 'CLINIC';
type Option = readonly [string, string];
const DOCTOR_KEYS = ['query', 'specialtyIds', 'cityIds', 'clinicIds', 'minRating', 'gender', 'languageCodes', 'minExperience', 'availability', 'date', 'academicDegrees', 'sortBy', 'page'];
const CLINIC_KEYS = ['query', 'cityIds', 'clinicTypes', 'specialtyIds', 'serviceIds', 'workModes', 'minRating', 'insurances', 'sortBy', 'page'];
const ratings = (): Option[] => [['', t('search.all')], ['3', '3+'], ['4', '4+'], ['4.5', '4.5+']];
const availability = (): Option[] => [['', t('search.any')], ['TODAY', t('search.today')], ['TOMORROW', t('search.tomorrow')], ['THIS_WEEK', t('search.thisWeek')]];
const workModes = (): Option[] => [['TWENTY_FOUR_SEVEN', '24/7'], ['WEEKEND', t('search.weekend')], ['EVENING', t('search.evening')]];

export function SearchPage({ mode }: { mode: Mode }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(params.get('query') ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const cities = useApi((sig) => catalogApi.cities(sig), []);

  useEffect(() => setQuery(params.get('query') ?? ''), [params]);

  const keys = mode === 'DOCTOR' ? DOCTOR_KEYS : CLINIC_KEYS;
  const q = useMemo(() => Object.fromEntries(keys.map((k) => [k, params.get(k) ?? undefined]).filter(([, v]) => v)), [params, keys]);
  const doctors = useApi((sig) => searchApi.doctors(q, sig), [JSON.stringify(q)], { enabled: mode === 'DOCTOR' });
  const clinics = useApi((sig) => searchApi.clinics(q, sig), [JSON.stringify(q)], { enabled: mode === 'CLINIC' });

  const list = (k: string) => (params.get(k) ?? '').split(',').filter(Boolean);
  const update = (patch: Record<string, string | string[] | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      const val = Array.isArray(v) ? v.join(',') : v;
      if (val) next.set(k, val);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };
  const toggle = (k: string, id: string) => update({ [k]: list(k).includes(id) ? list(k).filter((x) => x !== id) : [...list(k), id] });

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    rememberSearch(query);
    update({ query: query.trim() || null });
  };

  const pick = (it: AutocompleteItemDto) => {
    rememberSearch(it.label);
    if (it.type === 'DOCTOR') navigate(`/doctors/${it.id}`);
    else if (it.type === 'CLINIC') navigate(`/clinics/${it.id}`);
    else {
      setQuery('');
      update({ query: null, specialtyIds: [...new Set([...list('specialtyIds'), it.id])] });
    }
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    // Rejim dəyişəndə axtarış mətni və şəhər saxlanılır, qalan filtrlər sıfırlanır (UC-201 alt 2).
    const keep = new URLSearchParams();
    if (query.trim()) keep.set('query', query.trim());
    if (params.get('cityIds')) keep.set('cityIds', params.get('cityIds')!);
    navigate(`/search/${m === 'DOCTOR' ? 'doctors' : 'clinics'}${keep.toString() ? `?${keep}` : ''}`);
  };

  const cityName = (id: string) => cities.data?.find((c) => c.id === id)?.name ?? '…';
  const result = mode === 'DOCTOR' ? doctors : clinics;
  const data = result.data;

  // Aktiv filtr çipləri.
  const facetName = (facets: FacetDto[] | undefined, id: string) => facets?.find((f) => f.id === id)?.name ?? '…';
  const chips: { label: string; remove: () => void }[] = [];
  if (params.get('query')) chips.push({ label: `"${params.get('query')}"`, remove: () => update({ query: null }) });
  list('cityIds').forEach((id) => chips.push({ label: cityName(id), remove: () => toggle('cityIds', id) }));
  if (params.get('minRating')) chips.push({ label: t('search.ratingChip', { n: params.get('minRating')! }), remove: () => update({ minRating: null }) });
  if (mode === 'DOCTOR') {
    const f = (doctors.data as DoctorSearchResultDto | undefined)?.facets;
    list('specialtyIds').forEach((id) => chips.push({ label: facetName(f?.specialties, id), remove: () => toggle('specialtyIds', id) }));
    list('clinicIds').forEach((id) => chips.push({ label: facetName(f?.clinics, id), remove: () => toggle('clinicIds', id) }));
    if (params.get('gender')) chips.push({ label: params.get('gender') === 'FEMALE' ? t('search.femaleDoctor') : t('search.maleDoctor'), remove: () => update({ gender: null }) });
    list('languageCodes').forEach((c) => chips.push({ label: languageLabel(c), remove: () => toggle('languageCodes', c) }));
    if (params.get('minExperience')) chips.push({ label: t('search.experienceChip', { n: params.get('minExperience')! }), remove: () => update({ minExperience: null }) });
    if (params.get('availability')) chips.push({ label: availability().find(([v]) => v === params.get('availability'))?.[1] ?? '', remove: () => update({ availability: null }) });
    if (params.get('date')) chips.push({ label: t('search.dateChip', { date: params.get('date')! }), remove: () => update({ date: null }) });
    list('academicDegrees').forEach((d) => chips.push({ label: d, remove: () => toggle('academicDegrees', d) }));
  } else {
    const f = (clinics.data as ClinicSearchResultDto | undefined)?.facets;
    list('clinicTypes').forEach((ct) => chips.push({ label: clinicTypeLabel(ct), remove: () => toggle('clinicTypes', ct) }));
    list('specialtyIds').forEach((id) => chips.push({ label: facetName(f?.specialties, id), remove: () => toggle('specialtyIds', id) }));
    list('serviceIds').forEach((id) => chips.push({ label: facetName(f?.services, id), remove: () => toggle('serviceIds', id) }));
    list('workModes').forEach((m) => chips.push({ label: workModes().find(([v]) => v === m)?.[1] ?? m, remove: () => toggle('workModes', m) }));
    list('insurances').forEach((i) => chips.push({ label: i, remove: () => toggle('insurances', i) }));
  }
  const resetAll = () => {
    setQuery('');
    setParams(new URLSearchParams(), { replace: true });
  };

  const page = Number(params.get('page') ?? 1);
  const total = data?.totalCount ?? 0;
  const pages = data ? Math.max(1, Math.ceil(total / data.size)) : 1;

  return (
    <div className="container" style={{ paddingTop: 36 }}>
      <h1 className="page-title">{mode === 'DOCTOR' ? t('search.titleDoctors') : t('search.titleClinics')}</h1>
      <div className={s.modeTabs} role="tablist" aria-label={t('search.modeLabel')}>
        <button type="button" role="tab" aria-selected={mode === 'DOCTOR'} className={s.modeTab} onClick={() => switchMode('DOCTOR')}>
          {t('search.modeDoctor')}
        </button>
        <button type="button" role="tab" aria-selected={mode === 'CLINIC'} className={s.modeTab} onClick={() => switchMode('CLINIC')}>
          {t('search.modeClinic')}
        </button>
      </div>

      <form className={s.searchBar} onSubmit={submit} role="search">
        <QueryInput mode={mode} value={query} onChange={setQuery} onPick={pick} onSubmit={submit} />
        <div className={s.sep} />
        <label className={s.searchField}>
          <span className={s.searchLabel}>{t('search.city')}</span>
          <select className={s.searchControl} value={list('cityIds')[0] ?? ''} onChange={(e) => update({ cityIds: e.target.value || null })}>
            <option value="">{t('search.allCities')}</option>
            {cities.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className={s.sep} />
        {mode === 'DOCTOR' ? (
          <label className={s.searchField}>
            <span className={s.searchLabel}>{t('search.date')}</span>
            <input type="date" className={s.searchControl} value={params.get('date') ?? ''} onChange={(e) => update({ date: e.target.value || null })} />
          </label>
        ) : (
          <label className={s.searchField}>
            <span className={s.searchLabel}>{t('search.sort')}</span>
            <select className={s.searchControl} value={params.get('sortBy') ?? 'RATING'} onChange={(e) => update({ sortBy: e.target.value === 'RATING' ? null : e.target.value })}>
              <option value="RATING">{t('search.sortRating')}</option>
              <option value="DOCTOR_COUNT">{t('search.sortDoctorCount')}</option>
            </select>
          </label>
        )}
        <Button type="submit" arrow>
          {t('search.submit')}
        </Button>
      </form>

      <div className={s.layout}>
        <aside className={`${s.filters} ${filtersOpen ? s.filtersOpen : ''}`} aria-label={t('search.filters')}>
          <div className={s.filtersHead}>
            <h2 className={s.filtersTitle}>{t('search.filters')}</h2>
            <button type="button" className={s.reset} onClick={resetAll}>
              {t('search.resetFilters')}
            </button>
          </div>
          {chips.length > 0 && (
            <div className={s.chips}>
              {chips.map((c, i) => (
                <button key={i} type="button" className={s.chip} onClick={c.remove} aria-label={t('search.removeFilter', { label: c.label })}>
                  {c.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}

          {mode === 'DOCTOR' ? (
            <DoctorFilters data={doctors.data} list={list} toggle={toggle} update={update} params={params} />
          ) : (
            <ClinicFilters data={clinics.data} list={list} toggle={toggle} update={update} params={params} />
          )}
        </aside>

        <section aria-live="polite" aria-busy={result.loading}>
          <div className={s.resultsHead}>
            <div className={s.resultsCount}>{data ? t(mode === 'DOCTOR' ? 'search.foundDoctors' : 'search.foundClinics', { n: total }) : ' '}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Button variant="ghost" size="small" className={s.filterToggle} onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
                {t('search.filters')}
                {chips.length ? ` (${chips.length})` : ''}
              </Button>
              {mode === 'DOCTOR' && (
                <label className={s.sortLabel}>
                  {t('search.sort')}
                  <select className={s.sortSelect} value={params.get('sortBy') ?? 'RATING'} onChange={(e) => update({ sortBy: e.target.value === 'RATING' ? null : e.target.value })}>
                    <option value="RATING">{t('search.sortRating')}</option>
                    <option value="EXPERIENCE">{t('search.sortExperience')}</option>
                    <option value="EARLIEST_SLOT">{t('search.sortEarliest')}</option>
                  </select>
                </label>
              )}
            </div>
          </div>

          {result.loading && !data && (
            <div className={s.results}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={170} radius={18} />
              ))}
            </div>
          )}
          {result.error && <ErrorState message={t('search.error')} onRetry={result.reload} />}

          {data && total === 0 && (
            <div className="card" style={{ padding: '44px 22px' }}>
              <h3 style={{ fontSize: 22, fontWeight: 700 }}>{mode === 'DOCTOR' ? t('search.emptyDoctors') : t('search.emptyClinics')}</h3>
              <ul className="ink-soft" style={{ margin: '10px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
                {data.suggestions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <Button variant="secondary" onClick={resetAll} style={{ marginTop: 22 }}>
                {t('search.resetFilters')}
              </Button>
            </div>
          )}

          <div className={s.results} style={{ opacity: result.loading ? 0.6 : 1, transition: 'opacity .15s' }}>
            {mode === 'DOCTOR' && (doctors.data?.doctors ?? []).map((d) => <DoctorCard key={d.doctorId} doc={d} />)}
            {mode === 'CLINIC' && (clinics.data?.clinics ?? []).map((c) => <ClinicCard key={c.clinicId} clinic={c} />)}
          </div>

          {data && pages > 1 && (
            <nav className={s.pager} aria-label={t('search.pages')}>
              <Button variant="ghost" size="small" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
                {t('search.prev')}
              </Button>
              <span>
                {page} / {pages}
              </span>
              <Button variant="ghost" size="small" disabled={page >= pages} onClick={() => update({ page: String(page + 1) })}>
                {t('search.next')}
              </Button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}

interface FilterProps<T> {
  data: T | undefined;
  list: (k: string) => string[];
  toggle: (k: string, id: string) => void;
  update: (patch: Record<string, string | string[] | null>) => void;
  params: URLSearchParams;
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={s.group}>
      <div className={s.groupTitle}>{title}</div>
      {children}
    </div>
  );
}

function Checks({ facets, k, list, toggle, label }: { facets: FacetDto[] | undefined; k: string; list: (k: string) => string[]; toggle: (k: string, id: string) => void; label?: (id: string) => string }) {
  if (!facets) return <Skeleton height={120} />;
  return (
    <div className={s.checkList}>
      {facets.map((f) => (
        <label key={f.id} className={s.checkItem}>
          <input type="checkbox" checked={list(k).includes(f.id)} onChange={() => toggle(k, f.id)} />
          <span>{label ? label(f.id) : f.name}</span>
          <span className={s.count}>{f.count}</span>
        </label>
      ))}
    </div>
  );
}

function Segs({ options, value, onPick }: { options: readonly Option[]; value: string; onPick: (v: string) => void }) {
  return (
    <div className={s.segs}>
      {options.map(([v, label]) => (
        <button key={v || 'all'} type="button" className={s.seg} aria-pressed={value === v} onClick={() => onPick(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function DoctorFilters({ data, list, toggle, update, params }: FilterProps<DoctorSearchResultDto>) {
  return (
    <>
      <Group title={t('search.specialty')}>
        <Checks facets={data?.facets.specialties} k="specialtyIds" list={list} toggle={toggle} />
      </Group>
      <Group title={t('search.clinic')}>
        <select className={s.select} value={list('clinicIds')[0] ?? ''} onChange={(e) => update({ clinicIds: e.target.value || null })} aria-label={t('search.clinic')}>
          <option value="">{t('search.allClinics')}</option>
          {data?.facets.clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
      </Group>
      <Group title={t('search.minRating')}>
        <Segs options={ratings()} value={params.get('minRating') ?? ''} onPick={(v) => update({ minRating: v || null })} />
      </Group>
      <Group title={t('search.gender')}>
        <Segs
          options={[['', t('search.any')], ['FEMALE', t('search.female')], ['MALE', t('search.male')]]}
          value={params.get('gender') ?? ''}
          onPick={(v) => update({ gender: v || null })}
        />
      </Group>
      <Group title={t('search.language')}>
        <select className={s.select} value={list('languageCodes')[0] ?? ''} onChange={(e) => update({ languageCodes: e.target.value || null })} aria-label={t('search.language')}>
          <option value="">{t('search.any')}</option>
          {LANGUAGE_CODES.map((code) => (
            <option key={code} value={code}>
              {languageLabel(code)}
            </option>
          ))}
        </select>
      </Group>
      <Group title={t('search.experience')}>
        <select className={s.select} value={params.get('minExperience') ?? ''} onChange={(e) => update({ minExperience: e.target.value || null })} aria-label={t('search.experience')}>
          <option value="">{t('search.any')}</option>
          {[3, 7, 15].map((n) => (
            <option key={n} value={n}>
              {t('search.years', { n })}
            </option>
          ))}
        </select>
      </Group>
      <Group title={t('search.availability')}>
        <Segs options={availability()} value={params.get('availability') ?? ''} onPick={(v) => update({ availability: v || null })} />
      </Group>
      {data && data.facets.academicDegrees.length > 0 && (
        <Group title={t('search.academicDegree')}>
          <Checks facets={data.facets.academicDegrees} k="academicDegrees" list={list} toggle={toggle} />
        </Group>
      )}
    </>
  );
}

function ClinicFilters({ data, list, toggle, update, params }: FilterProps<ClinicSearchResultDto>) {
  return (
    <>
      <Group title={t('search.clinicType')}>
        <Checks facets={data?.facets.clinicTypes} k="clinicTypes" list={list} toggle={toggle} label={clinicTypeLabel} />
      </Group>
      <Group title={t('search.specialtiesAvailable')}>
        <Checks facets={data?.facets.specialties} k="specialtyIds" list={list} toggle={toggle} />
      </Group>
      <Group title={t('search.services')}>
        <Checks facets={data?.facets.services} k="serviceIds" list={list} toggle={toggle} />
      </Group>
      <Group title={t('search.workMode')}>
        <div className={s.segs}>
          {workModes().map(([v, label]) => (
            <button key={v} type="button" className={s.seg} aria-pressed={list('workModes').includes(v)} onClick={() => toggle('workModes', v)}>
              {label}
            </button>
          ))}
        </div>
      </Group>
      <Group title={t('search.minRating')}>
        <Segs options={ratings()} value={params.get('minRating') ?? ''} onPick={(v) => update({ minRating: v || null })} />
      </Group>
      {data && data.facets.insurances.length > 0 && (
        <Group title={t('search.insurance')}>
          <Checks facets={data.facets.insurances} k="insurances" list={list} toggle={toggle} />
        </Group>
      )}
    </>
  );
}
