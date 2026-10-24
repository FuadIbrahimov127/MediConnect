import type { AppointmentDto } from '@mediconnect/shared';
import { t } from '../../i18n';
import { Link } from 'react-router-dom';
import { formatDate, formatTime } from '../../lib/format';
import { StatusBadge } from './status';
import s from './doctorRow.module.css';

// Həkimin randevu sətri (FR-703-03/04): saat, pasient, xidmət, status, klinika (bir neçə klinikadadırsa).

export function DoctorAppointmentRow({ a, showDate, showClinic }: { a: AppointmentDto; showDate?: boolean; showClinic?: boolean }) {
  return (
    <Link to={`/doctor/appointments/${a.appointmentId}`} className={s.row}>
      <div className={s.time}>
        <strong>{formatTime(a.startAt)}</strong>
        {showDate && <span>{formatDate(a.slotDate)}</span>}
      </div>
      <div className={s.main}>
        <div className={s.patient}>{a.patient?.fullName}</div>
        <div className={s.meta}>
          {a.service.name}
          {a.patient?.age !== null && a.patient?.age !== undefined ? ` · ${t('common.age', { n: a.patient.age })}` : ''}
          {showClinic ? ` · ${a.clinic.name}` : ''}
        </div>
        {a.patientContext && a.patientContext.allergies.length > 0 && <div className={s.allergy}>Allergiya: {a.patientContext.allergies.map((x) => x.allergenName).join(', ')}</div>}
      </div>
      <StatusBadge status={a.status} />
    </Link>
  );
}
