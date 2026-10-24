import type { ClinicCardDto, DoctorCardDto } from '@mediconnect/shared';
import { t, type TKey } from '../../i18n';
import { Link } from 'react-router-dom';
import { Avatar, ButtonLink } from '../../components/ui';
import { formatSlotLabel } from '../../lib/format';
import s from './directory.module.css';

// Axtarış nəticəsi kartları (FR-201-22..25, FR-202-12..16). Qiymət göstərilmir.

/** Klinika növü və dil adları interfeys dilində (i18n). */
export const clinicTypeLabel = (type: string) => t(`clinicTypes.${type}` as TKey);
export const languageLabel = (code: string) => ((['az', 'ru', 'en', 'tr'] as const).includes(code as 'az') ? t(`languages.${code}` as TKey) : code);
export const LANGUAGE_CODES = ['az', 'ru', 'en', 'tr'] as const;

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span className={s.stars} style={{ fontSize: size }} aria-label={t('directory.stars', { n: value })}>
      {'★'.repeat(full)}
      <span className={s.starsOff}>{'★'.repeat(5 - full)}</span>
    </span>
  );
}

export function RatingBlock({ rating, reviewCount, isNew }: { rating: number | null; reviewCount: number; isNew?: boolean }) {
  if (isNew || rating === null) return <span className={s.newTag}>{t('directory.newDoctor')}</span>;
  return (
    <div className={s.rating}>
      <div className={s.ratingValue}>
        <span className={s.star} aria-hidden="true">
          ★
        </span>
        {rating.toFixed(1)}
      </div>
      <div className={s.ratingSub}>{t('directory.reviewsCount', { n: reviewCount })}</div>
    </div>
  );
}

export function DoctorCard({ doc }: { doc: DoctorCardDto }) {
  const meta = [doc.specialties.join(', '), doc.academicDegree, doc.experienceYears ? t('directory.yearsExp', { n: doc.experienceYears }) : null].filter(Boolean).join(' · ');
  return (
    <article className={s.card}>
      <div className={s.cardGrid}>
        <Avatar name={doc.fullName} src={doc.photoUrl} size={64} />
        <div>
          <h3 style={{ margin: 0 }}>
            <Link to={`/doctors/${doc.doctorId}`} className={s.cardName}>
              {doc.fullName}
            </Link>
          </h3>
          <div className={s.cardMeta}>{meta}</div>
          {doc.languages.length > 0 && (
            <div className={s.pills}>
              {doc.languages.map((l) => (
                <span key={l} className={s.pill}>
                  {languageLabel(l)}
                </span>
              ))}
            </div>
          )}
          <div className={s.cardClinics}>{doc.clinics.map((c) => `${c.name}, ${c.cityName}`).join(' · ')}</div>
        </div>
        <RatingBlock rating={doc.rating} reviewCount={doc.reviewCount} isNew={doc.isNew} />
      </div>
      <div className={s.cardFoot}>
        <div className={s.nearest}>
          {doc.earliestSlot ? (
            <>
              <span>{t('directory.earliest')} </span>
              {formatSlotLabel(doc.earliestSlot)}
            </>
          ) : (
            <span>{t('directory.noSlotsSoon')}</span>
          )}
        </div>
        <div className={s.cardActions}>
          <ButtonLink to={`/doctors/${doc.doctorId}`} variant="ghost" size="small">
            {t('directory.viewProfile')}
          </ButtonLink>
          <ButtonLink to={`/doctors/${doc.doctorId}#vaxtlar`} size="small">
            {t('detail.bookCta')}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

export function ClinicCard({ clinic }: { clinic: ClinicCardDto }) {
  return (
    <article className={s.card}>
      <div className={s.cardGrid}>
        <Avatar name={clinic.name} src={clinic.logoUrl} size={64} />
        <div>
          <h3 style={{ margin: 0 }}>
            <Link to={`/clinics/${clinic.clinicId}`} className={s.cardName}>
              {clinic.name}
            </Link>
          </h3>
          <div className={s.cardMeta}>
            {clinicTypeLabel(clinic.clinicType)} · {clinic.address}
            {clinic.distanceKm !== null && ` · ${clinic.distanceKm} km`}
          </div>
          <div className={s.pills}>
            <span className={s.pill}>{clinic.hoursSummary}</span>
            <span className={s.pill}>{t('directory.doctorsCount', { n: clinic.doctorCount })}</span>
            <span className={s.pill}>{clinic.specialtyCount} ixtisas</span>
          </div>
        </div>
        <div className={s.rating}>
          {clinic.rating !== null ? (
            <div className={s.ratingValue}>
              <span className={s.star} aria-hidden="true">
                ★
              </span>
              {clinic.rating.toFixed(1)}
            </div>
          ) : (
            <span className={s.newTag}>{t('common.newBadge')}</span>
          )}
        </div>
      </div>
      {!clinic.acceptingAppointments && <p className="field-hint" style={{ marginBottom: 0 }}>{t('directory.notAcceptingTemp')}</p>}
    </article>
  );
}
