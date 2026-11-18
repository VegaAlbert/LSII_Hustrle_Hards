import { useTranslation } from '../i18n/i18nContext';
import { MAX_SCORE } from '../ratings/ratingsApi';

type Props = {
  // null while the video has no ratings
  average: number | null;
  count: number;
};

const STARS = '★'.repeat(MAX_SCORE);

/**
 * Average rating of a video as stars filled up to the average, e.g. "★★★★½ 4.5/5 (25 ratings)", or "No ratings yet".
 */
const StarRating = ({ average, count }: Props) => {
  const { t, language } = useTranslation();
  if (average === null || count === 0) {
    return <p className="star-rating text-muted mb-0">{t('video.noRatings')}</p>;
  }
  const averageText = new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
    average
  );
  return (
    <p className="star-rating mb-0">
      {/* Empty stars with the filled ones on top, cut at the average */}
      <span className="star-rating-stars" aria-hidden="true">
        {STARS}
        <span className="star-rating-fill" style={{ width: `${(average / MAX_SCORE) * 100}%` }}>
          {STARS}
        </span>
      </span>
      <strong>
        {averageText}/{MAX_SCORE}
      </strong>
      <span className="text-muted">({t('video.ratingCount', { count })})</span>
    </p>
  );
};

export default StarRating;
