import type { AppointmentDto } from '@mediconnect/shared';
import { Rich } from '../../i18n/Rich';
import { t } from '../../i18n';
import { Link } from 'react-router-dom';
import { ButtonLink } from '../../components/ui';
import { formatDateTime } from '../../lib/format';
import { StatusBadge } from './status';
import s from './appointments.module.css';

// Randevu kartı (FR-404-03): həkim, ixtisas · xidmət, vaxt, klinika və ünvan, booking reference, status badge.

export function AppointmentCard({ a }: { a: AppointmentDto }) {
  return (
    <article className={s.card}>
      <div className={s.cardGrid}>
        <div>
          <h3 className={s.title}>
            <Link to={`/account/appointments/${a.appointmentId}`}>{a.doctor.fullName}</Link>
          </h3>
          <div className={s.meta}>
            {a.doctor.specialties.join(', ')} · {a.service.name}
          </div>
          <div className={s.when}>{formatDateTime(a.startAt)}</div>
          <div className={s.place}>
            {a.clinic.name}
            <br />
            {a.clinic.address}
          </div>
          <div className={s.ref}>{a.bookingReference}</div>
        </div>
        <StatusBadge status={a.status} />
      </div>
      {a.pendingReschedule && (
        <div className={s.notice}>
          <Rich
            text={t(a.pendingReschedule.requestedByRole === 'CLINIC_ADMIN' ? 'appt.proposalClinic' : 'appt.proposalDoctor')}
            b={`${formatDateTime(a.pendingReschedule.newStartAt)}${a.pendingReschedule.newDoctorName ? ` (${a.pendingReschedule.newDoctorName})` : ''}`}
          />
        </div>
      )}
      <div className={s.actions}>
        <ButtonLink to={`/account/appointments/${a.appointmentId}`} variant="ghost" size="small">
          {t('common.details')}
        </ButtonLink>
        {a.allowedActions.includes('REVIEW') && (
          <ButtonLink to={`/account/appointments/${a.appointmentId}/review`} size="small">
            {t('appt.writeReview')}
          </ButtonLink>
        )}
        {a.status === 'CANCELLED' && a.cancellationReason && <span className={s.reason}>{t('common.reasonColon', { reason: a.cancellationReason })}</span>}
      </div>
    </article>
  );
}
