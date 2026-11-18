import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/i18nContext';

type Props = {
  title?: string;
};

/**
 * Shown for unknown routes and for videos that do not exist (US-05), instead of a broken page.
 */
const NotFoundPage = ({ title }: Props) => {
  const { t } = useTranslation();
  return (
    <section className="text-center py-5">
      <h1 className="h3">{title ?? t('videos.notFoundTitle')}</h1>
      <p className="text-muted">{t('videos.notFoundText')}</p>
      <Link to="/" className="btn btn-primary">
        {t('videos.backHome')}
      </Link>
    </section>
  );
};

export default NotFoundPage;
