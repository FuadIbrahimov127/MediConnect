import { ROLE_HOME, type UserRole } from '@mediconnect/shared';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PageLoader } from '../components/PageLoader';
import { useAuth } from './AuthContext';

/** Giriş tələb edən səhifələr: yoxdursa /login?returnUrl=… (FR-102-12 return URL). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return <PageLoader />;
  if (!user) {
    const returnUrl = location.pathname + location.search;
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }
  return <>{children}</>;
}

/** Rol yoxlaması — səhv rol öz panelinə yönləndirilir. Server də eyni yoxlamanı edir (qoruma UI-da deyil). */
export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user } = useAuth();
  if (user && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <>{children}</>;
}

/** Login/qeydiyyat səhifələri — artıq daxil olubsa öz panelinə. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, initializing, homePath } = useAuth();
  if (initializing) return <PageLoader />;
  if (user) return <Navigate to={homePath} replace />;
  return <>{children}</>;
}
