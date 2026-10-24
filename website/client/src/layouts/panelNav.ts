import type { UserRole } from '@mediconnect/shared';
import type { TKey } from '../i18n';

// Panel sidebar naviqasiyası — route-lar spec "Səhifə xəritəsi" ilə eynidir.

export interface NavItem {
  to: string;
  label: TKey;
  /** Yalnız tam uyğunluqda aktiv (panel kök səhifəsi üçün). */
  end?: boolean;
  /** Bildiriş sayğacı göstərilsin. */
  unreadBadge?: boolean;
}

export const PANEL_NAV: Record<UserRole, NavItem[]> = {
  PATIENT: [
    { to: '/account', label: 'panel.patient.overview', end: true },
    { to: '/account/appointments', label: 'panel.patient.appointments' },
    { to: '/account/documents', label: 'panel.patient.documents', end: true },
    { to: '/account/documents/shares', label: 'panel.patient.shares' },
    { to: '/account/medical-history', label: 'panel.patient.history' },
    { to: '/account/prescriptions', label: 'panel.patient.prescriptions' },
    { to: '/account/notifications', label: 'panel.patient.notifications', unreadBadge: true },
    { to: '/account/profile', label: 'panel.patient.profile' },
    { to: '/account/settings', label: 'panel.patient.settings' },
  ],
  DOCTOR: [
    { to: '/doctor', label: 'panel.doctor.dashboard', end: true },
    { to: '/doctor/appointments', label: 'panel.doctor.appointments' },
    { to: '/doctor/prescriptions', label: 'panel.doctor.prescriptions' },
    { to: '/doctor/schedule', label: 'panel.doctor.schedule' },
    { to: '/doctor/reviews', label: 'panel.doctor.reviews' },
    { to: '/doctor/notifications', label: 'panel.doctor.notifications', unreadBadge: true },
    { to: '/doctor/profile', label: 'panel.doctor.profile' },
  ],
  CLINIC_ADMIN: [
    { to: '/clinic-admin', label: 'panel.clinicAdmin.dashboard', end: true },
    { to: '/clinic-admin/appointments', label: 'panel.clinicAdmin.appointments' },
    { to: '/clinic-admin/doctors', label: 'panel.clinicAdmin.doctors' },
    { to: '/clinic-admin/services', label: 'panel.clinicAdmin.services' },
    { to: '/clinic-admin/reports', label: 'panel.clinicAdmin.reports' },
    { to: '/clinic-admin/notifications', label: 'panel.clinicAdmin.notifications', unreadBadge: true },
    { to: '/clinic-admin/profile', label: 'panel.clinicAdmin.profile' },
  ],
  SUPER_ADMIN: [
    { to: '/admin', label: 'panel.admin.dashboard', end: true },
    { to: '/admin/clinics', label: 'panel.admin.clinics' },
    { to: '/admin/users', label: 'panel.admin.users' },
    { to: '/admin/moderation/reviews', label: 'panel.admin.moderation' },
    { to: '/admin/settings', label: 'panel.admin.settings' },
    { to: '/admin/catalogs', label: 'panel.admin.catalogs' },
    { to: '/admin/audit-log', label: 'panel.admin.audit' },
    { to: '/admin/security', label: 'panel.admin.security' },
    { to: '/admin/notifications', label: 'panel.admin.notifications', unreadBadge: true },
  ],
};

export const NOTIFICATIONS_PATH: Record<UserRole, string> = {
  PATIENT: '/account/notifications',
  DOCTOR: '/doctor/notifications',
  CLINIC_ADMIN: '/clinic-admin/notifications',
  SUPER_ADMIN: '/admin/notifications',
};
