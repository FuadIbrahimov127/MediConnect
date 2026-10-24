import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { ThemeToggle } from '../components/ThemeToggle';
import { Avatar, Logo } from '../components/ui';
import { useUnreadCount } from '../features/notifications/useUnreadCount';
import { t } from '../i18n';
import s from './layouts.module.css';
import { NOTIFICATIONS_PATH, PANEL_NAV } from './panelNav';

/** Rol panelləri üçün shell: üst header + sol sidebar (prototip "Şəxsi Kabinet" quruluşu). */
export function PanelLayout() {
  const { user, signOut } = useAuth();
  const unread = useUnreadCount();
  if (!user) return null;
  const fullName = `${user.role === 'DOCTOR' ? 'Dr. ' : ''}${user.firstName} ${user.lastName}`;

  return (
    <>
      <header className={s.header}>
        <div className={`container ${s.headerInner}`}>
          <Logo />
          <div className={s.headerActions}>
            <span className={s.hideMobile}>
              <LanguageSwitch />
            </span>
            <ThemeToggle />
            {user.role === 'PATIENT' && (
              <Link to="/search/doctors" className={`${s.headerLinkSoft} ${s.hideMobile}`}>
                {t('nav.findDoctor')}
              </Link>
            )}
            <Link to={NOTIFICATIONS_PATH[user.role]} className={s.bell} aria-label={`${t('nav.notifications')}${unread ? ` (${unread} ${t('notifications.unread')})` : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
              {unread > 0 && <span className={s.bellCount}>{unread > 99 ? '99+' : unread}</span>}
            </Link>
            <button type="button" className={s.headerLink} onClick={() => void signOut()}>
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className={`container ${s.shell}`}>
        <aside className={s.side} aria-label={t('common.panelNav')}>
          <div className={s.sideUser}>
            <Avatar name={fullName} src={user.photoUrl} />
            <div>
              <div className={s.sideName}>{fullName}</div>
              <div className={s.sideRole}>{t(`roles.${user.role}`)}</div>
            </div>
          </div>
          <nav className={s.sideNav}>
            {PANEL_NAV[user.role].map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `${s.sideLink} ${isActive ? s.sideLinkActive : ''}`}>
                {t(item.label)}
                {item.unreadBadge && unread > 0 && <span className={s.sideBadge}>{unread}</span>}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className={s.panelMain}>
          <Outlet />
        </main>
      </div>
    </>
  );
}
