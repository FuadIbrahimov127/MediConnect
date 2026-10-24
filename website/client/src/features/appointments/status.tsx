import type { AppointmentStatus } from '@mediconnect/shared';
import { t } from '../../i18n';
import { Badge, type Tone } from '../../components/ui';

// Status badge-ləri (FR-404-04) — ui-guide.md rəng qaydası.

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: t('appt.PENDING'),
  CONFIRMED: t('appt.CONFIRMED'),
  COMPLETED: t('appt.COMPLETED'),
  CANCELLED: t('appt.CANCELLED'),
  NO_SHOW: t('appt.NO_SHOW'),
};

const TONE: Record<AppointmentStatus, Tone> = { PENDING: 'warning', CONFIRMED: 'success', COMPLETED: 'neutral', CANCELLED: 'danger', NO_SHOW: 'danger' };

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

/** Server `blockedReasons` kodlarının istifadəçi mətnləri. */
export const BLOCKED_TEXT: Record<string, string> = {
  CancellationTooLate: t('appt.blockedCancel'),
  RescheduleTooLate: t('appt.blockedReschedule'),
  RescheduleLimitExceeded: t('appt.blockedLimit'),
  AppointmentNotStarted: t('appt.blockedNotStarted'),
};
