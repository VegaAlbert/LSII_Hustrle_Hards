import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import Avatar from '../components/Avatar';
import SubscribeButton from '../components/SubscribeButton';
import VideoCard from '../components/VideoCard';
import { useTranslation } from '../i18n/i18nContext';
import { useSubscribedChannels } from '../subscriptions/useSubscribedChannels';
import { useSubscriptionVideos } from '../subscriptions/useSubscriptionVideos';

/**
 * US-13: at /subscriptions, the channels the logged-in user is subscribed to and, below them, the latest videos of
 * those channels. Visitors who are not logged in are sent to the login page and come back here afterwards.
 */
const SubscriptionsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return (
    <section aria-labelledby="subscriptions-title" className="text-start">
      <h1 id="subscriptions-title" className="section-title mb-4">
        {t('library.subscriptionsTitle')}
      </h1>
      <SubscribedChannels />
      <SubscriptionVideos />
    </section>
  );
};

// Separate components so the lists are only requested for logged-in users (hooks cannot be called conditionally)
const SubscribedChannels = () => {
  const { channels, status, retry } = useSubscribedChannels();
  const { t } = useTranslation();

  return (
    <section aria-labelledby="subscribed-channels-title" className="mb-5">
      <h2 id="subscribed-channels-title" className="h5 mb-3">
        {t('library.channelsTitle')}
      </h2>

      {status === 'loading' && (
        <p role="status" className="text-muted mb-0">
          {t('library.channelsLoading')}
        </p>
      )}
      {status === 'error' && (
        <div role="alert" className="alert alert-danger d-flex align-items-center gap-3 mb-0">
          <span>{t('library.channelsError')}</span>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={retry}>
            {t('library.retry')}
          </button>
        </div>
      )}
      {status === 'success' && channels.length === 0 && (
        <div className="favourites-empty">
          <p className="mb-2">{t('library.channelsEmpty')}</p>
          <p className="mb-3">{t('library.subscriptionsEmptyHint')}</p>
          <Link to="/" className="btn btn-primary btn-sm">
            {t('library.browseVideos')}
          </Link>
        </div>
      )}
      {channels.length > 0 && (
        <ul aria-label={t('library.channelsList')} className="list-unstyled channel-list mb-0">
          {channels.map(({ channel }) => (
            <li key={channel} className="channel-item">
              <Avatar name={channel} />
              <span className="channel-name">{channel}</span>
              {/* Shows the subscribers and lets the user unsubscribe (and subscribe again) from here */}
              <SubscribeButton channel={channel} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const SubscriptionVideos = () => {
  const { videos, status, hasMore, loadMore, retry } = useSubscriptionVideos();
  const { t } = useTranslation();

  return (
    <section aria-labelledby="subscription-videos-title">
      <h2 id="subscription-videos-title" className="h5 mb-3">
        {t('library.latestVideosTitle')}
      </h2>

      {status === 'success' && videos.length === 0 && <p className="text-muted">{t('library.subscriptionsEmpty')}</p>}

      {videos.length > 0 && (
        <ul
          aria-label={t('library.subscriptionsList')}
          className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4 list-unstyled video-grid"
        >
          {videos.map((video) => (
            <li key={video.id} className="col">
              <VideoCard video={video} />
            </li>
          ))}
        </ul>
      )}

      <div className="d-flex flex-column align-items-center gap-2 my-4">
        {status === 'loading' && (
          <p role="status" className="text-muted mb-0">
            {t('library.subscriptionsLoading')}
          </p>
        )}
        {status === 'error' && (
          <div role="alert" className="alert alert-danger d-flex align-items-center gap-3 mb-0">
            <span>{t('library.subscriptionsError')}</span>
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={retry}>
              {t('library.retry')}
            </button>
          </div>
        )}
        {status === 'success' && hasMore && (
          <button type="button" className="btn btn-primary" onClick={loadMore}>
            {t('library.loadMore')}
          </button>
        )}
      </div>
    </section>
  );
};

export default SubscriptionsPage;
