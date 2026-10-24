import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildQuery } from '../../api/client';
import { catalogApi } from '../../api/endpoints';
import { useApi } from '../../api/hooks';
import { searchApi } from '../../api/search';
import { Avatar, Button, ButtonLink, Skeleton } from '../../components/ui';
import { formatSlotLabel } from '../../lib/format';
import { t } from '../../i18n';
import s from './HomePage.module.css';

// Ana səhifə (route "/") — prototip "MediConnect Ana Səhifə". Axtarış paneli /search/doctors-a filtrlərlə keçir (UC-201).
// Statistika, seçilmiş həkimlər və ixtisas sayları mock API-dən gəlir.

export function HomePage() {
  const navigate = useNavigate();
  const specialties = useApi((sig) => catalogApi.specialties(sig), []);
  const cities = useApi((sig) => catalogApi.cities(sig), []);
  const featured = useApi((sig) => searchApi.doctors({ size: 4 }, sig), []);
  const clinicsCount = useApi((sig) => searchApi.clinics({ size: 1 }, sig), []);
  const top = featured.data?.doctors[0];
  const rated = featured.data?.doctors.filter((d) => d.rating !== null) ?? [];
  const avgRating = rated.length ? (rated.reduce((a, d) => a + (d.rating ?? 0), 0) / rated.length).toFixed(1) : '—';
  const [specialtyId, setSpecialtyId] = useState('');
  const [cityId, setCityId] = useState('');
  const [date, setDate] = useState('');

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search/doctors${buildQuery({ specialtyIds: specialtyId, cityIds: cityId, date })}`);
  };

  return (
    <div className="container">
      <section className={s.hero}>
        <div>
          <div className="eyebrow">
            <span>{t('home.eyebrow')}</span>
          </div>
          <h1 className={s.title}>
            {t('home.titleA')}
            <br />
            {t('home.titleB')}
          </h1>
          <p className={s.lead}>{t('home.lead')}</p>
          <div className={s.cta}>
            <ButtonLink to="/search/doctors" arrow>
              {t('home.ctaBook')}
            </ButtonLink>
            <ButtonLink to="#necə-işləyir" variant="ghost" arrow reloadDocument>
              {t('home.ctaHow')}
            </ButtonLink>
          </div>
          <div className={s.stats}>
            <div>
              <div className={s.statValue}>{featured.data?.totalCount ?? '—'}</div>
              <div className={s.statLabel}>{t('home.statDoctors')}</div>
            </div>
            <div className={s.statSep} />
            <div>
              <div className={s.statValue}>{clinicsCount.data?.totalCount ?? '—'}</div>
              <div className={s.statLabel}>{t('home.statClinics')}</div>
            </div>
            <div className={s.statSep} />
            <div>
              <div className={s.statValue}>{avgRating}</div>
              <div className={s.statLabel}>{t('home.statRating')}</div>
            </div>
          </div>
        </div>

        <div className={s.art} aria-hidden="true">
          <div className={s.artBox}>
            <svg viewBox="0 0 220 220" width="62%" height="62%" fill="none" stroke="var(--accent)" strokeWidth="2">
              <circle cx="110" cy="72" r="34" />
              <path d="M46 186c0-35 29-58 64-58s64 23 64 58" />
              <rect x="24" y="24" width="52" height="52" rx="12" stroke="var(--ink-soft)" opacity=".35" />
              <rect x="146" y="146" width="52" height="52" rx="12" stroke="var(--ink-soft)" opacity=".35" />
              <path d="M110 150v28M96 164h28" stroke="var(--ink-soft)" opacity=".35" />
            </svg>
          </div>
          {top && (
            <div className={s.floatCard}>
              <div className={s.floatTop}>
                <span>{top.earliestSlot ? formatSlotLabel(top.earliestSlot) : t('home.heroCardWhen')}</span>
                {top.rating !== null && (
                  <span>
                    <span className={s.star}>★</span> {top.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 14 }}>{top.fullName}</div>
              <div className="muted" style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>
                {top.specialties.join(', ')}
              </div>
              <ButtonLink to={`/doctors/${top.doctorId}#vaxtlar`} size="small" style={{ marginTop: 16 }} tabIndex={-1}>
                {t('home.heroCardCta')}
              </ButtonLink>
            </div>
          )}
        </div>
      </section>

      <form className={s.search} onSubmit={onSearch} aria-label={t('common.search')}>
        <label className={s.searchField}>
          <span className={s.searchLabel}>{t('home.searchSpecialty')}</span>
          <select className={s.searchControl} value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)}>
            <option value="">{t('home.anySpecialty')}</option>
            {specialties.data?.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>
        </label>
        <div className={s.sep} />
        <label className={s.searchField}>
          <span className={s.searchLabel}>{t('home.searchCity')}</span>
          <select className={s.searchControl} value={cityId} onChange={(e) => setCityId(e.target.value)}>
            <option value="">{t('home.anyCity')}</option>
            {cities.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className={s.sep} />
        <label className={s.searchField}>
          <span className={s.searchLabel}>{t('home.searchDate')}</span>
          <input type="date" className={s.searchControl} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <Button type="submit" arrow>
          {t('common.search')}
        </Button>
      </form>

      <section id="necə-işləyir" className={s.section}>
        <div className="eyebrow">
          <span>{t('home.stepsEyebrow')}</span>
        </div>
        <h2 className={s.h2}>{t('home.stepsTitle')}</h2>
        <div className={s.steps}>
          {(
            [
              ['01', 'home.step1Title', 'home.step1Body'],
              ['02', 'home.step2Title', 'home.step2Body'],
              ['03', 'home.step3Title', 'home.step3Body'],
            ] as const
          ).map(([num, title, body]) => (
            <div key={num} className="card">
              <div className={s.stepNum}>{num}</div>
              <h3 className={s.stepTitle}>{t(title)}</h3>
              <p className={s.stepBody}>{t(body)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>{t('home.specialtiesTitle')}</h2>
        <div className={s.chips}>
          {specialties.data
            ?.filter((sp) => (sp.doctorCount ?? 0) > 0)
            .map((sp) => (
              <Link key={sp.id} to={`/search/doctors?specialtyIds=${sp.id}`} className={s.chip}>
                <span className="muted" style={{ display: 'block', fontSize: 13, fontWeight: 500 }}>
                  {t('directory.doctorsCount', { n: sp.doctorCount ?? 0 })}
                </span>
                {sp.name}
              </Link>
            ))}
        </div>
      </section>

      <section id="həkimlər" className={s.section}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <h2 className={s.h2}>{t('home.featuredTitle')}</h2>
          <Link to="/search/doctors" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)' }}>
            {t('common.seeAll')}
          </Link>
        </div>
        <div className={s.featured}>
          {featured.data?.doctors.map((d) => (
            <Link key={d.doctorId} to={`/doctors/${d.doctorId}`} className={`card ${s.featuredCard}`}>
              <Avatar name={d.fullName} src={d.photoUrl} size={64} />
              <h3 style={{ margin: '16px 0 4px', fontSize: 16, fontWeight: 600 }}>{d.fullName}</h3>
              <div className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{d.specialties.join(', ')}</div>
              {d.rating !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, marginTop: 12 }}>
                  <span className={s.star}>★</span>
                  {d.rating.toFixed(1)}
                  <span className="muted" style={{ fontWeight: 500 }}>· {t('directory.reviewsCount', { n: d.reviewCount })}</span>
                </div>
              )}
              <div className="ink-soft" style={{ fontSize: 13, fontWeight: 500, marginTop: 12, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                {d.clinics.map((c) => `${c.name}, ${c.cityName}`).join(' · ')}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}>{d.earliestSlot ? t('detail.nearest', { time: formatSlotLabel(d.earliestSlot) }) : t('home.noSlots')}</div>
            </Link>
          ))}
          {!featured.data && [0, 1, 2, 3].map((i) => <Skeleton key={i} height={240} radius={18} />)}
        </div>
      </section>
    </div>
  );
}
