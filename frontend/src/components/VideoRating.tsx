import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isUnauthorized, toApiError } from '../auth/authApi';
import { useAuth } from '../auth/authContext';
import { useTranslation } from '../i18n/i18nContext';
import { useVideoRating } from '../ratings/useVideoRating';
import StarRating from './StarRating';
import StarRatingInput from './StarRatingInput';
import './VideoRating.css';

type Feedback = { kind: 'success' | 'error'; message: string } | null;

/**
 * Video ratings on the video page: the average of everybody and, for logged-in users, a 1 to 5 star picker to rate
 * the video or change their rating. Anonymous visitors are invited to log in and come back.
 */
const VideoRating = ({ videoId }: { videoId: number }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const location = useLocation();
  const { rating, status, retry, rate } = useVideoRating(videoId, user?.username ?? null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const handleRate = async (score: number) => {
    if (score === rating?.myScore) return;
    const hadRated = rating?.myScore != null;
    setSaving(true);
    setFeedback(null);
    try {
      await rate(score);
      setFeedback({
        kind: 'success',
        message: hadRated ? t('video.ratingUpdated') : t('video.ratingSaved'),
      });
    } catch (error: unknown) {
      setFeedback({
        kind: 'error',
        message: isUnauthorized(error)
          ? t('video.ratingSessionExpired')
          : t('video.ratingSaveError', { reason: toApiError(error, language).message }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="video-rating" aria-labelledby="rating-title">
      <h2 id="rating-title" className="section-label">
        {t('video.ratingTitle')}
      </h2>

      {status === 'loading' && (
        <p role="status" className="text-muted mb-0">
          {t('video.ratingLoading')}
        </p>
      )}
      {status === 'error' && (
        <div role="alert" className="d-flex align-items-center gap-3">
          <span>{t('video.ratingLoadError')}</span>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={retry}>
            {t('video.retry')}
          </button>
        </div>
      )}
      {status === 'success' && rating && (
        <div className="video-rating-row">
          <StarRating average={rating.average} count={rating.count} />

          {user ? (
            <div className="video-rating-mine">
              <span className="text-muted">{rating.myScore ? t('video.yourRating') : t('video.rateThis')}</span>
              <StarRatingInput value={rating.myScore} onRate={handleRate} disabled={saving} />
            </div>
          ) : (
            <Link to="/login" state={{ from: `${location.pathname}${location.search}` }} className="pill-btn">
              {t('video.loginToRate')}
            </Link>
          )}
        </div>
      )}

      {feedback && (
        <p
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          className={`video-rating-feedback mb-0 is-${feedback.kind}`}
        >
          {feedback.message}
        </p>
      )}
    </section>
  );
};

export default VideoRating;
