import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { t } from '../i18n';
import s from './ui.module.css';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function Logo({ large, to = '/' }: { large?: boolean; to?: string }) {
  return (
    <Link to={to} className={cx(s.logo, large && s.logoLarge)} aria-label={t('common.homeLink')}>
      mediconnect<span className={s.logoDot} />
    </Link>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
interface BtnStyle {
  variant?: Variant;
  size?: 'md' | 'small';
  block?: boolean;
  /** Prototipdəki dairəvi ox ikonu. */
  arrow?: boolean;
  loading?: boolean;
}

const btnClass = ({ variant = 'primary', size = 'md', block, arrow }: BtnStyle, extra?: string) =>
  cx(s.btn, s[variant], size === 'small' && s.small, block && s.block, arrow && s.withArrow, extra);

const Arrow = () => (
  <span className={s.arrow} aria-hidden="true">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  </span>
);

export function Button({ variant, size, block, arrow, loading, children, className, disabled, type = 'button', ...rest }: BtnStyle & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={btnClass({ variant, size, block, arrow }, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className={s.spinner} aria-hidden="true" />}
      {children}
      {arrow && !loading && <Arrow />}
    </button>
  );
}

export function ButtonLink({ variant, size, block, arrow, children, className, ...rest }: BtnStyle & LinkProps) {
  return (
    <Link className={btnClass({ variant, size, block, arrow }, className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

export function Skeleton({ width = '100%', height = 16, radius }: { width?: number | string; height?: number | string; radius?: number }) {
  return <div className={s.skeleton} style={{ width, height, borderRadius: radius }} aria-hidden="true" />;
}

export function EmptyState({ title, body, action, icon }: { title: string; body?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className={s.empty}>
      <div className={s.emptyIcon} aria-hidden="true">
        {icon ?? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
        )}
      </div>
      <div className={s.emptyTitle}>{title}</div>
      {body && <div className={s.emptyBody}>{body}</div>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      title={t('common.errorTitle')}
      body={message}
      action={onRetry && <Button variant="ghost" onClick={onRetry}>{t('common.retry')}</Button>}
    />
  );
}

export type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'accent';

export function Badge({ tone = 'neutral', children, dot = true }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cx(s.badge, s[`tone-${tone}`])}>
      {dot && <span className={s.badgeDot} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Avatar({ name, src, size = 44 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .replace(/^Dr\.\s*/, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <span className={s.avatar} style={{ width: size, height: size, fontSize: Math.round(size / 3) }} aria-hidden={!src}>
      {src ? <img src={src} alt={name} /> : initials}
    </span>
  );
}

export { cx };
