import { ButtonLink, EmptyState } from '../components/ui';
import { t } from '../i18n';

export function NotFoundPage() {
  return (
    <div className="container" style={{ padding: '72px 24px' }}>
      <div className="card">
        <EmptyState title={t('common.notFoundTitle')} body={t('common.notFoundBody')} action={<ButtonLink to="/">{t('common.goHome')}</ButtonLink>} />
      </div>
    </div>
  );
}
