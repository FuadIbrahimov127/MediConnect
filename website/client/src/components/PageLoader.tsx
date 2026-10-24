import { Skeleton } from './ui';
import { t } from '../i18n';

/** Səhifə səviyyəsində skeleton (auth yoxlaması, lazy səhifələr). */
export function PageLoader() {
  return (
    <div className="container" style={{ padding: '48px 24px', display: 'grid', gap: 16 }} aria-busy="true" aria-label={t('common.loading')}>
      <Skeleton width="40%" height={34} />
      <Skeleton height={120} radius={18} />
      <Skeleton height={120} radius={18} />
    </div>
  );
}
