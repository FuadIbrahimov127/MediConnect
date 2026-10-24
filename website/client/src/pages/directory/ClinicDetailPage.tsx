import type { ClinicDetailDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { dayName } from '../../lib/format';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { serverNow } from '../../api/client';
import { useApi } from '../../api/hooks';
import { searchApi } from '../../api/search';
import { Avatar, ButtonLink, EmptyState, Skeleton } from '../../components/ui';
import { clinicTypeLabel, DoctorCard } from '../../features/directory/cards';
import { MapEmbed, mapsDirectionsUrl } from '../../features/directory/MapEmbed';
import { ReviewsSection } from '../../features/directory/ReviewsSection';
import s from '../../features/directory/directory.module.css';

// UC-302 — klinikanın detallı səhifəsi: haqqında, əlaqə və xəritə, iş saatları, xidmətlər, həkimlər (ixtisas filtri), rəylər.


export function ClinicDetailPage() {
  const { clinicId = '' } = useParams();
  const q = useApi((sig) => searchApi.clinic(clinicId, sig), [clinicId]);
  if (q.error) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="card">
          <EmptyState
            title={(q.error.details as { inactive?: boolean } | undefined)?.inactive ? q.error.message : t('clinicDetail.notFound')}
            action={
              <Link to="/search/clinics" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                {t('clinicDetail.backToSearch')}
              </Link>
            }
          />
        </div>
      </div>
    );
  }
  if (!q.data)
    return (
      <div className="container" style={{ paddingTop: 40, display: 'grid', gap: 24 }}>
        <Skeleton height={160} radius={18} />
        <Skeleton height={320} radius={18} />
      </div>
    );
  return <ClinicView c={q.data} />;
}

function ClinicView({ c }: { c: ClinicDetailDto }) {
  const [specialty, setSpecialty] = useState<string | null>(null);
  const doctors = useMemo(() => (specialty ? c.doctors.filter((d) => d.specialties.includes(specialty)) : c.doctors), [c.doctors, specialty]);
  const todayDow = ((new Date(serverNow() + 4 * 3600_000).getUTCDay() + 6) % 7) + 1;
  const categories = [...new Set(c.services.map((sv) => sv.category ?? t('clinicDetail.other')))];

  return (
    <div className="container">
      <nav className={s.crumbs} aria-label={t('detail.breadcrumbs')}>
        <Link to="/search/clinics">{t('clinicDetail.clinics')}</Link> · {c.cityName} · {c.name}
      </nav>

      <section className="card">
        <div className={s.head}>
          <div className={s.headMain}>
            <Avatar name={c.name} src={c.logoUrl} size={96} />
            <div>
              <h1 className={s.h1}>{c.name}</h1>
              <div className={s.sub}>
                {clinicTypeLabel(c.clinicType)}
                {c.foundedYear ? ` · ${t('clinicDetail.since', { year: c.foundedYear })}` : ''}
                {c.is24x7 ? ' · 24/7' : ''}
              </div>
              <div className={s.headRating}>
                {c.rating !== null ? (
                  <>
                    <span className={s.star}>★</span>
                    {c.rating.toFixed(1)}
                    <span className="muted">· {t('directory.reviewsCount', { n: c.reviewCount })} · {t('directory.doctorsCount', { n: c.doctors.length })}</span>
                  </>
                ) : (
                  <span className="muted">{t('directory.doctorsCount', { n: c.doctors.length })}</span>
                )}
              </div>
              {c.specialties.length > 0 && (
                <div className={s.pills} style={{ marginTop: 14 }}>
                  {c.specialties.map((sp) => (
                    <span key={sp.id} className={s.pill}>
                      {sp.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className={s.headActions}>
            <ButtonLink to={`/search/doctors?clinicIds=${c.clinicId}`} arrow>
              {t('clinicDetail.allDoctors')}
            </ButtonLink>
            {!c.acceptingAppointments && <span className="field-hint">{t('directory.notAcceptingTemp')}</span>}
          </div>
        </div>
      </section>

      <div className={s.detailGrid}>
        <div className={s.col}>
          {c.description && (
            <section className="card">
              <h2 className={s.h2}>{t('detail.about')}</h2>
              <p className={s.p} style={{ margin: 0 }}>
                {c.description}
              </p>
              {c.insurances.length > 0 && (
                <p className={s.note}>
                  {t('clinicDetail.insurance')} <strong>{c.insurances.join(', ')}</strong>
                </p>
              )}
            </section>
          )}

          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <h2 className={s.h2}>{t('nav.doctors')}</h2>
              <Link to={`/search/doctors?clinicIds=${c.clinicId}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
                {t('clinicDetail.openInSearch')}
              </Link>
            </div>
            {c.doctors.length === 0 ? (
              <p className="ink-soft">{t('clinicDetail.noDoctors')}</p>
            ) : (
              <>
                {c.specialties.length > 1 && (
                  <div className={s.segs} style={{ marginBottom: 16 }}>
                    <button type="button" className={s.seg} aria-pressed={!specialty} onClick={() => setSpecialty(null)}>
                      {t('clinicDetail.all')}
                    </button>
                    {c.specialties.map((sp) => (
                      <button key={sp.id} type="button" className={s.seg} aria-pressed={specialty === sp.name} onClick={() => setSpecialty(sp.name)}>
                        {sp.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className={s.results}>
                  {doctors.map((d) => (
                    <DoctorCard key={d.doctorId} doc={d} />
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="card">
            <h2 className={s.h2}>{t('detail.services')}</h2>
            {categories.map((cat) => (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', margin: '6px 0' }}>
                  {cat}
                </div>
                {c.services
                  .filter((sv) => (sv.category ?? t('clinicDetail.other')) === cat)
                  .map((sv) => (
                    <div key={sv.serviceId} className={s.serviceRow}>
                      <span>{sv.name}</span>
                    </div>
                  ))}
              </div>
            ))}
            <p className={s.note}>{t('common.priceNote')}.</p>
          </section>

          {c.photos.length > 0 && (
            <section className="card">
              <h2 className={s.h2}>{t('clinicDetail.gallery')}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {c.photos.map((p) => (
                  <img key={p} src={p} alt={c.name} style={{ borderRadius: 12, aspectRatio: '4/3', objectFit: 'cover' }} />
                ))}
              </div>
            </section>
          )}

          <ReviewsSection load={(q, sig) => searchApi.clinicReviews(c.clinicId, q, sig)} title={t('reviewList.clinicTitle')} showDoctor />
        </div>

        <aside className={s.side}>
          <section className="card">
            <h2 className={s.h2}>{t('clinicDetail.contact')}</h2>
            <div style={{ display: 'grid', gap: 8, fontSize: 15 }}>
              <span>{c.address}</span>
              <a href={`tel:${c.phone}`} style={{ fontWeight: 600 }}>
                {c.phone}
              </a>
              {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
              {c.website && (
                <a href={c.website} target="_blank" rel="noopener noreferrer">
                  {c.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
            {c.latitude !== null && c.longitude !== null && (
              <>
                <MapEmbed lat={c.latitude} lng={c.longitude} title={c.name} />
                <a href={mapsDirectionsUrl(c.latitude, c.longitude)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
                  {t('clinicDetail.directions')}
                </a>
              </>
            )}
          </section>
          <section className="card">
            <h2 className={s.h2}>{t('clinicDetail.hours')}</h2>
            <table className={s.hoursTable}>
              <tbody>
                {c.workingHours.map((h) => (
                  <tr key={h.dayOfWeek} className={h.dayOfWeek === todayDow ? s.today : undefined}>
                    <td>{dayName(h.dayOfWeek)}</td>
                    <td>{h.isClosed ? t('clinicDetail.closed') : c.is24x7 ? t('clinicDetail.allDay') : `${h.opensAt} — ${h.closesAt}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </aside>
      </div>
    </div>
  );
}
