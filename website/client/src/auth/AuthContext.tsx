import { ROLE_HOME, type AuthResultDto, type CurrentUserDto } from '@mediconnect/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { tokenStore, UNAUTHORIZED_EVENT } from '../api/client';
import { sessionApi } from '../api/endpoints';

interface AuthState {
  user: CurrentUserDto | null;
  /** İlk /auth/me yoxlaması bitənə qədər true — guard-lar gözləyir. */
  initializing: boolean;
  /** Sessiya müddəti bitdiyi üçün çıxış edildi (login səhifəsində mesaj göstərmək üçün). */
  expired: boolean;
  signIn: (result: AuthResultDto) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  homePath: string;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUserDto | null>(null);
  const [initializing, setInitializing] = useState(() => Boolean(tokenStore.get()));
  const [expired, setExpired] = useState(false);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null);
      return;
    }
    try {
      setUser(await sessionApi.me());
    } catch {
      tokenStore.set(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setInitializing(false));
  }, [refresh]);

  // Hər hansı sorğu 401 qaytaranda (BR-102-04 sessiya timeout) istifadəçini çıxart.
  useEffect(() => {
    const onUnauthorized = () => {
      tokenStore.set(null);
      setUser(null);
      setExpired(true);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const signIn = useCallback((result: AuthResultDto) => {
    tokenStore.set(result.token);
    setUser(result.user);
    setExpired(false);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await sessionApi.logout();
    } catch {
      /* sessiya artıq bitib */
    }
    tokenStore.set(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, initializing, expired, signIn, signOut, refresh, homePath: user ? ROLE_HOME[user.role] : '/' }),
    [user, initializing, expired, signIn, signOut, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider daxilində istifadə olunmalıdır');
  return ctx;
}
