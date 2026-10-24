import { Link, NavLink, Outlet } from 'react-router-dom';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import { ButtonLink, Logo } from '../components/ui';
import { t } from '../i18n';
import s from './layouts.module.css';

export function SiteHeader() {
  const { user, homePath, signOut } = useAuth();
  return (
    <header className={s.header}>
      <div className={`container ${s.headerInner}`}>
        <Logo />
        <nav className={s.nav} aria-label={t('common.mainNav')}>
          <a href="/#necə-işləyir">{t('nav.howItWorks')}</a>
          <NavLink to="/search/doctors">{t('nav.doctors')}</NavLink>
          <NavLink to="/search/clinics">{t('nav.clinics')}</NavLink>
          <NavLink to="/faq">{t('nav.faq')}</NavLink>
          <NavLink to="/contact">{t('nav.contact')}</NavLink>
        </nav>
        <div className={s.headerActions}>
          <LanguageSwitch />
          <ThemeToggle />
          {user ? (
            <>
              <Link to={homePath} className={s.headerLink}>
                {t('nav.myPanel')}
              </Link>
              <button type="button" className={`${s.headerLinkSoft} ${s.hideMobile}`} onClick={() => void signOut()}>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={s.headerLink}>
                {t('nav.login')}
              </Link>
              <ButtonLink to="/search/doctors" variant="secondary" className={s.hideMobile}>
                {t('nav.book')}
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className={s.footer}>
      <div className={`container ${s.footerInner}`}>
        <div className={s.footerGrid}>
          <div>
            <Logo large />
          </div>
          <div>
            <div className={s.footerTitle}>{t('footer.platform')}</div>
            <div className={s.footerLinks}>
              <a href="/#necə-işləyir">{t('footer.about')}</a>
              <a href="/#necə-işləyir">{t('footer.howItWorks')}</a>
              <a href="mailto:hr@mediconnect.az">{t('footer.careers')}</a>
            </div>
          </div>
          <div>
            <div className={s.footerTitle}>{t('footer.forPatients')}</div>
            <div className={s.footerLinks}>
              <Link to="/search/doctors">{t('footer.findDoctor')}</Link>
              <Link to="/account/appointments">{t('footer.myAppointments')}</Link>
              <Link to="/account/documents">{t('footer.medicalDocs')}</Link>
            </div>
          </div>
          <div>
            <div className={s.footerTitle}>{t('footer.forClinics')}</div>
            <div className={s.footerLinks}>
              <a href="mailto:clinics@mediconnect.az">{t('footer.join')}</a>
              <Link to="/clinic-admin">{t('footer.dashboard')}</Link>
              <a href="mailto:salam@mediconnect.az">{t('footer.support')}</a>
            </div>
          </div>
          <div>
            <div className={s.footerTitle}>{t('footer.contact')}</div>
            <div className={s.footerLinks}>
              <a href="tel:+994122000000">+994 12 200 00 00</a>
              <a href="mailto:salam@mediconnect.az">salam@mediconnect.az</a>
              <span style={{ color: 'var(--footer-muted)' }}>{t('common.address')}</span>
            </div>
          </div>
        </div>
        <div className={s.footerBottom}>
          <span>{t('footer.rights')}</span>
          <span>{t('footer.disclaimer')}</span>
        </div>
      </div>
    </footer>
  );
}

/** Public səhifələr: ana səhifə, axtarış, həkim/klinika səhifələri. */
export function PublicLayout() {
  return (
    <>
      <SiteHeader />
      <main className={s.main}>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}

/** Qeydiyyat, giriş, PIN bərpası — mərkəzdə kart. */
export function AuthLayout() {
  return (
    <>
      <SiteHeader />
      <main className={s.authWrap}>
        <div className={s.authCard}>
          <Outlet />
        </div>
      </main>
    </>
  );
}
