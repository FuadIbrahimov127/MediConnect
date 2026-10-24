import type { DoctorCardDto, DoctorDetailDto, SlotDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../api/hooks';
import { searchApi } from '../../api/search';
import { useAuth } from '../../auth/AuthContext';
import { Avatar, Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { clinicTypeLabel, DoctorCard } from '../../features/directory/cards';
import { MapEmbed, mapsDirectionsUrl } from '../../features/directory/MapEmbed';
import { ReviewsSection } from '../../features/directory/ReviewsSection';
import { SlotPicker } from '../../features/directory/SlotPicker';
import s from '../../features/directory/directory.module.css';
import { formatSlotLabel } from '../../lib/format';

// UC-301 — həkimin detallı səhifəsi (prototip "Həkim Profili"). Guest "Randevu al" → qeydiyyat + return URL (FR-301-27/28).

export function DoctorDetailPage() {
  const { doctorId = '' } = useParams();
  const q = useApi((sig) => searchApi.doctor(doctorId, sig), [doctorId]);

  if (q.error && q.error.errorType !== 'NotFound') return <div className="container" style={{ paddingTop: 40 }}><ErrorState message={q.error.message} onRetry={q.reload} /></div>;
  if (q.error) {
    const alternatives = (q.error.details as { alternatives?: DoctorCardDto[] } | undefined)?.alternatives;
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="card">
          <EmptyState
            title={alternatives ? q.error.message : t('detail.doctorNotFound')}
            body={alternatives ? t('detail.sameSpecialty') : t('detail.linkInvalid')}
            action={
              <Link to="/search/doctors" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                {t('detail.backToSearch')}
              </Link>
            }
          />
        </div>
        {alternatives && alternatives.length > 0 && (
          <div className={s.results} style={{ marginTop: 24 }}>
            {alternatives.map((d) => (
              <DoctorCard key={d.doctorId} doc={d} />
            ))}
          </div>
        )}
      </div>
    );
  }
  if (!q.data) {
    return (
      <div className="container" style={{ paddingTop: 40, display: 'grid', gap: 24 }}>
        <Skeleton height={180} radius={18} />
        <Skeleton height={320} radius={18} />
      </div>
    );
  }
  return <DoctorView doc={q.data} />;
}

function DoctorView({ doc }: { doc: DoctorDetailDto }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [clinicId, setClinicId] = useState(doc.clinics[0]?.clinicId ?? '');
  const clinic = doc.clinics.find((c) => c.clinicId === clinicId) ?? doc.clinics[0];
  const primary = doc.specialties.find((x) => x.isPrimary) ?? doc.specialties[0];

  useEffect(() => {
    if (location.hash === '#vaxtlar') document.getElementById('vaxtlar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  const book = (slot?: SlotDto) => {
    const qs = new URLSearchParams({ clinicId: clinic.clinicId });
    if (slot) qs.set('slotId', slot.slotId);
    const target = `/booking/${doc.doctorId}?${qs}`;
    if (!user) {
      // FR-301-27/28: qeydiyyatsız istifadəçi → qeydiyyat, sonra randevu səhifəsinə qayıdış.
      navigate(`/register?returnUrl=${encodeURIComponent(target)}`);
      return;
    }
    if (user.role !== 'PATIENT') {
      toast.show(t('detail.patientOnly'), t('detail.otherRole'));
      return;
    }
    navigate(target);
  };

  const share = async () => {
    const url = window.location.href.split('#')[0];
    try {
      if (navigator.share) await navigator.share({ title: doc.fullName, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t('detail.linkCopied'));
      }
    } catch {
      /* istifadəçi imtina etdi */
    }
  };

  return (
    <div className="container">
      <nav className={s.crumbs} aria-label={t('detail.breadcrumbs')}>
        <Link to="/search/doctors">{t('nav.doctors')}</Link> · {primary && <Link to={`/search/doctors?specialtyIds=${primary.id}`}>{primary.name}</Link>} · {doc.fullName}
      </nav>

      <section className="card">
        <div className={s.head}>
          <div className={s.headMain}>
            <Avatar name={doc.fullName} src={doc.photoUrl} size={96} />
            <div>
              <h1 className={s.h1}>{doc.fullName}</h1>
              <div className={s.sub}>{[doc.specialties.map((x) => x.name).join(', '), doc.academicDegree].filter(Boolean).join(' · ')}</div>
              <div className={s.headRating}>
                {doc.isNew ? (
                  <span className={s.newTag}>{t('directory.newDoctor')}</span>
                ) : (
                  <>
                    <span className={s.star}>★</span>
                    {doc.rating.average?.toFixed(1)}
                    <span className="muted">· {t('detail.reviewsShort', { n: doc.rating.count })}</span>
                  </>
                )}
                {doc.experienceYears ? <span className="muted">· {t('directory.yearsExp', { n: doc.experienceYears })}</span> : null}
              </div>
              <div className={s.pills} style={{ marginTop: 14 }}>
                {doc.languages.map((l) => (
                  <span key={l.code} className={s.pill}>
                    {l.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className={s.headActions}>
            <Button arrow onClick={() => book()} disabled={!clinic}>
              {t('detail.bookCta')}
            </Button>
            <button type="button" className={s.reset} onClick={() => void share()}>
              {t('detail.share')}
            </button>
          </div>
        </div>
      </section>

      <div className={s.detailGrid}>
        <div className={s.col}>
          {doc.bio && (
            <section className="card">
              <h2 className={s.h2}>{t('detail.about')}</h2>
              <p className={s.p} style={{ margin: 0 }}>
                {doc.bio}
              </p>
            </section>
          )}
          {doc.education.length > 0 && (
            <section className="card">
              <h2 className={s.h2}>{t('detail.education')}</h2>
              <div className={s.timeline}>
                {doc.education.map((row) => {
                  const [period, text] = row.includes(' | ') ? row.split(' | ') : ['', row];
                  return (
                    <div key={row} className={s.timeRow}>
                      <span>{period}</span>
                      <span>{text}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {(doc.specializationAreas.length > 0 || doc.certificates.length > 0) && (
            <section className="card">
              {doc.specializationAreas.length > 0 && (
                <>
                  <h2 className={s.h2}>{t('detail.areas')}</h2>
                  <div className={s.tagList}>
                    {doc.specializationAreas.map((a) => (
                      <span key={a} className={s.tag}>
                        {a}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {doc.certificates.length > 0 && (
                <>
                  <h2 className={s.h2} style={{ marginTop: 22 }}>
                    {t('detail.certificates')}
                  </h2>
                  {doc.certificates.map((c) => (
                    <div key={c.title} className={s.serviceRow}>
                      <span>{c.title}</span>
                      <span>{c.year}</span>
                    </div>
                  ))}
                </>
              )}
            </section>
          )}
          <section className="card">
            <h2 className={s.h2} style={{ marginBottom: 6 }}>
              {t('detail.services')}
            </h2>
            {doc.clinics.map((c) => (
              <div key={c.clinicId} className={s.serviceBlock}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{c.name}</h3>
                <div className="muted" style={{ fontSize: 13, fontWeight: 500 }}>
                  {c.address}
                </div>
                <div style={{ marginTop: 14 }}>
                  {c.services.map((sv) => (
                    <div key={sv.serviceId} className={s.serviceRow}>
                      <span>{sv.name}</span>
                      <span>{t('detail.minutes', { n: sv.durationMinutes })}</span>
                    </div>
                  ))}
                </div>
                <p className={s.note}>{t('common.priceNote')}.</p>
              </div>
            ))}
          </section>
          <ReviewsSection load={(q, sig) => searchApi.doctorReviews(doc.doctorId, q, sig)} />
        </div>

        <aside className={s.side}>
          <section className="card" id="vaxtlar" style={{ scrollMarginTop: 96 }}>
            <h2 className={s.h2}>{t('detail.freeTimes')}</h2>
            {doc.clinics.length > 1 && (
              <div className={s.clinicTabs} role="group" aria-label={t('detail.clinicPick')}>
                {doc.clinics.map((c) => (
                  <button key={c.clinicId} type="button" className={s.seg} aria-pressed={c.clinicId === clinic?.clinicId} onClick={() => setClinicId(c.clinicId)}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            {clinic && <SlotPicker doctorId={doc.doctorId} clinicId={clinic.clinicId} onPick={(slot) => book(slot)} />}
            <p className={s.note}>{t('detail.slotHint')}</p>
          </section>

          <section className="card">
            <h2 className={s.h2}>{t('detail.worksAt')}</h2>
            {doc.clinics.map((c) => (
              <div key={c.clinicId} className={s.clinicItem}>
                <Link to={`/clinics/${c.clinicId}`} style={{ fontSize: 16, fontWeight: 600 }}>
                  {c.name}
                </Link>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {clinicTypeLabel(c.clinicType)} · {c.address}
                  {c.roomNumber && ` · ${t('detail.room', { n: c.roomNumber })}`}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{c.earliestSlot ? t('detail.nearest', { time: formatSlotLabel(c.earliestSlot) }) : t('directory.noSlotsSoon')}</div>
                {c.latitude !== null && c.longitude !== null && (
                  <a href={mapsDirectionsUrl(c.latitude, c.longitude)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 6, fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                    {t('detail.directions')}
                  </a>
                )}
                {c === clinic && c.latitude !== null && c.longitude !== null && <MapEmbed lat={c.latitude} lng={c.longitude} title={c.name} />}
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
