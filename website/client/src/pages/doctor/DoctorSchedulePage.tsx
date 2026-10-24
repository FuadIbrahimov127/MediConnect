import { doctorApi, doctorScheduleApi } from '../../api/doctor';
import { t } from '../../i18n';
import { useApi } from '../../api/hooks';
import { ErrorState, Skeleton } from '../../components/ui';
import { ScheduleEditor } from '../../features/schedule/ScheduleEditor';

// UC-702 — həkimin cədvəli (klinikalar tab şəklində — FR-702-02).

export function DoctorSchedulePage() {
  const q = useApi((sig) => doctorApi.profile(sig), []);
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.reload} />;
  if (!q.data) return <Skeleton height={420} radius={18} />;
  const clinics = q.data.clinics.filter((c) => c.status === 'ACTIVE' || c.status === 'INACTIVE').map((c) => ({ clinicId: c.clinicId, name: c.name }));
  return (
    <div>
      <h1 className="page-title">{t('panel.doctor.schedule')}</h1>
      <ScheduleEditor api={doctorScheduleApi} clinics={clinics} role="DOCTOR" />
    </div>
  );
}
