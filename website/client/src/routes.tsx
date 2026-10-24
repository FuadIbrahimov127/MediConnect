import type { UserRole } from '@mediconnect/shared';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { GuestOnly, RequireAuth, RequireRole } from './auth/guards';
import { AuthLayout, PublicLayout } from './layouts/PublicLayout';
import { PanelLayout } from './layouts/PanelLayout';
import { AppointmentDetailPage } from './pages/account/AppointmentDetailPage';
import { AppointmentsPage } from './pages/account/AppointmentsPage';
import { OverviewPage } from './pages/account/OverviewPage';
import { DocumentsPage } from './pages/account/DocumentsPage';
import { MedicalHistoryPage } from './pages/account/MedicalHistoryPage';
import { ProfilePage } from './pages/account/ProfilePage';
import { SharesPage } from './pages/account/SharesPage';
import { PatientDocumentsPage } from './pages/doctor/PatientDocumentsPage';
import { BookingPage } from './pages/booking/BookingPage';
import { SettingsPage } from './pages/account/SettingsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ResetPinPage } from './pages/auth/ResetPinPage';
import { ClinicDetailPage } from './pages/directory/ClinicDetailPage';
import { DoctorDetailPage } from './pages/directory/DoctorDetailPage';
import { DoctorAppointmentDetailPage } from './pages/doctor/DoctorAppointmentDetailPage';
import { DoctorAppointmentsPage } from './pages/doctor/DoctorAppointmentsPage';
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage';
import { DoctorProfilePage } from './pages/doctor/DoctorProfilePage';
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedulePage';
import { HomePage } from './pages/home/HomePage';
import { SearchPage } from './pages/search/SearchPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { RootShell } from './RootShell';
import { InvitePage } from './pages/auth/InvitePage';
import { InProduction } from './components/InProduction';
import { ReviewPage } from './pages/account/ReviewPage';
import { DoctorReviewsPage } from './pages/doctor/DoctorReviewsPage';
import { ModerationPage } from './pages/admin/ModerationPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminCatalogsPage } from './pages/admin/AdminCatalogsPage';
import { AdminClinicDetailPage } from './pages/admin/AdminClinicDetailPage';
import { AdminClinicsPage } from './pages/admin/AdminClinicsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { ClinicCreatePage } from './pages/admin/ClinicCreatePage';
import { ClinicAppointmentDetailPage } from './pages/clinicAdmin/ClinicAppointmentDetailPage';
import { ClinicAppointmentsPage } from './pages/clinicAdmin/ClinicAppointmentsPage';
import { ClinicDashboardPage } from './pages/clinicAdmin/ClinicDashboardPage';
import { ClinicDoctorDetailPage } from './pages/clinicAdmin/ClinicDoctorDetailPage';
import { ClinicDoctorSchedulePage } from './pages/clinicAdmin/ClinicDoctorSchedulePage';
import { ClinicDoctorsPage } from './pages/clinicAdmin/ClinicDoctorsPage';
import { ClinicProfilePage } from './pages/clinicAdmin/ClinicProfilePage';
import { ClinicReportsPage } from './pages/clinicAdmin/ClinicReportsPage';
import { ClinicServicesPage } from './pages/clinicAdmin/ClinicServicesPage';
import { DoctorInvitePage } from './pages/clinicAdmin/DoctorInvitePage';
import { PrescriptionsPage } from './pages/account/PrescriptionsPage';
import { PrescriptionDetailPage } from './pages/account/PrescriptionDetailPage';
import { PrescriptionEditorPage } from './pages/doctor/PrescriptionEditorPage';
import { DoctorPrescriptionsPage } from './pages/doctor/DoctorPrescriptionsPage';
import { DoctorPrescriptionDetailPage } from './pages/doctor/DoctorPrescriptionDetailPage';
import { VerifyPrescriptionPage } from './pages/prescriptions/VerifyPrescriptionPage';

// Səhifə xəritəsi — spec "Səhifə xəritəsi (Site Map & Routes)". Hər səhifə öz URL-indədir.

const panel = (roles: UserRole[], children: RouteObject[]): RouteObject => ({
  element: (
    <RequireAuth>
      <RequireRole roles={roles}>
        <PanelLayout />
      </RequireRole>
    </RequireAuth>
  ),
  children,
});

export const router = createBrowserRouter([
  {
    element: <RootShell />,
    children: [
      // ── Public (Guest) ──
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/search/doctors', element: <SearchPage key="doctors" mode="DOCTOR" /> },
          { path: '/search/clinics', element: <SearchPage key="clinics" mode="CLINIC" /> },
          { path: '/doctors/:doctorId', element: <DoctorDetailPage /> },
          { path: '/clinics/:clinicId', element: <ClinicDetailPage /> },
          { path: '/faq', element: <InProduction /> },
          { path: '/contact', element: <InProduction /> },
          { path: '/prescriptions/verify/:qrToken', element: <VerifyPrescriptionPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: (
          <GuestOnly>
            <AuthLayout />
          </GuestOnly>
        ),
        children: [
          { path: '/register', element: <RegisterPage /> },
          { path: '/login', element: <LoginPage /> },
          { path: '/login/reset-pin', element: <ResetPinPage /> },
        ],
      },
      { element: <AuthLayout />, children: [{ path: '/invite/:token', element: <InvitePage /> }] },

      // ── Randevu yaratma (Patient, public header ilə) ──
      {
        element: (
          <RequireAuth>
            <RequireRole roles={['PATIENT']}>
              <PublicLayout />
            </RequireRole>
          </RequireAuth>
        ),
        children: [{ path: '/booking/:doctorId', element: <BookingPage /> }],
      },

      // ── Patient ──
      panel(['PATIENT'], [
        { path: '/account', element: <OverviewPage /> },
        { path: '/account/profile', element: <ProfilePage /> },
        { path: '/account/settings', element: <SettingsPage /> },
        { path: '/account/appointments', element: <AppointmentsPage /> },
        { path: '/account/appointments/:appointmentId', element: <AppointmentDetailPage /> },
        { path: '/account/appointments/:appointmentId/review', element: <ReviewPage /> },
        { path: '/account/documents', element: <DocumentsPage /> },
        { path: '/account/documents/shares', element: <SharesPage /> },
        { path: '/account/medical-history', element: <MedicalHistoryPage /> },
        { path: '/account/prescriptions', element: <PrescriptionsPage /> },
        { path: '/account/prescriptions/:prescriptionId', element: <PrescriptionDetailPage /> },
        { path: '/account/notifications', element: <NotificationsPage /> },
      ]),

      // ── Doctor ──
      panel(['DOCTOR'], [
        { path: '/doctor', element: <DoctorDashboardPage /> },
        { path: '/doctor/profile', element: <DoctorProfilePage /> },
        { path: '/doctor/schedule', element: <DoctorSchedulePage /> },
        { path: '/doctor/appointments', element: <DoctorAppointmentsPage /> },
        { path: '/doctor/appointments/:appointmentId', element: <DoctorAppointmentDetailPage /> },
        { path: '/doctor/appointments/:appointmentId/prescription', element: <PrescriptionEditorPage /> },
        { path: '/doctor/prescriptions', element: <DoctorPrescriptionsPage /> },
        { path: '/doctor/reviews', element: <DoctorReviewsPage /> },
        { path: '/doctor/prescriptions/:prescriptionId', element: <DoctorPrescriptionDetailPage /> },
        { path: '/doctor/patients/:patientId/documents', element: <PatientDocumentsPage /> },
        { path: '/doctor/notifications', element: <NotificationsPage /> },
      ]),

      // ── Clinic Admin ──
      panel(['CLINIC_ADMIN'], [
        { path: '/clinic-admin', element: <ClinicDashboardPage /> },
        { path: '/clinic-admin/profile', element: <ClinicProfilePage /> },
        { path: '/clinic-admin/doctors', element: <ClinicDoctorsPage /> },
        { path: '/clinic-admin/doctors/new', element: <DoctorInvitePage /> },
        { path: '/clinic-admin/doctors/:doctorId', element: <ClinicDoctorDetailPage /> },
        { path: '/clinic-admin/doctors/:doctorId/schedule', element: <ClinicDoctorSchedulePage /> },
        { path: '/clinic-admin/services', element: <ClinicServicesPage /> },
        { path: '/clinic-admin/appointments', element: <ClinicAppointmentsPage /> },
        { path: '/clinic-admin/appointments/:appointmentId', element: <ClinicAppointmentDetailPage /> },
        { path: '/clinic-admin/reports', element: <ClinicReportsPage /> },
        { path: '/clinic-admin/notifications', element: <NotificationsPage /> },
      ]),

      // ── Super Admin ──
      panel(['SUPER_ADMIN'], [
        { path: '/admin', element: <AdminDashboardPage /> },
        { path: '/admin/clinics', element: <AdminClinicsPage /> },
        { path: '/admin/clinics/new', element: <ClinicCreatePage /> },
        { path: '/admin/clinics/:clinicId/verify', element: <AdminClinicDetailPage /> },
        { path: '/admin/users', element: <AdminUsersPage /> },
        { path: '/admin/users/:userId', element: <AdminUserDetailPage /> },
        { path: '/admin/moderation/reviews', element: <ModerationPage /> },
        { path: '/admin/settings', element: <AdminSettingsPage /> },
        { path: '/admin/catalogs', element: <AdminCatalogsPage /> },
        { path: '/admin/audit-log', element: <AdminAuditPage /> },
        { path: '/admin/security', element: <AdminSecurityPage /> },
        { path: '/admin/notifications', element: <NotificationsPage /> },
      ]),
    ],
  },
]);
