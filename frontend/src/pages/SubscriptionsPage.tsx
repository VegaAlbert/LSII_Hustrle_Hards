import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import VideoCard from '../components/VideoCard';
import { useSubscriptionVideos } from '../subscriptions/useSubscriptionVideos';

/**
 * US-13: videos of the channels the logged-in user is subscribed to, at /subscriptions, newest first. Visitors who are
 * not logged in are sent to the login page and come back here afterwards.
 */
const SubscriptionsPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <SubscriptionVideos />;
};

// Separate component so the list is only requested for logged-in users (hooks cannot be called conditionally)
const SubscriptionVideos = () => {
  const { videos, status, hasMore, loadMore, retry } = useSubscriptionVideos();

  return (
    <section aria-labelledby="subscriptions-title" className="text-start">
      <h1 id="subscriptions-title" className="section-title mb-4">
        Subscriptions
      </h1>

      {status === 'success' && videos.length === 0 && (
        <div className="favourites-empty">
          <p className="mb-2">There are no videos from your subscriptions yet.</p>
          <p className="mb-3">Use “Subscribe” on a video to follow the channel of its author.</p>
          <Link to="/" className="btn btn-primary btn-sm">
            Browse videos
          </Link>
        </div>
      )}

      {videos.length > 0 && (
        <ul
          aria-label="Videos from your subscriptions"
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
            Loading subscriptions...
          </p>
        )}
        {status === 'error' && (
          <div role="alert" className="alert alert-danger d-flex align-items-center gap-3 mb-0">
            <span>Could not load your subscriptions.</span>
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={retry}>
              Retry
            </button>
          </div>
        )}
        {status === 'success' && hasMore && (
          <button type="button" className="btn btn-primary" onClick={loadMore}>
            Load more
          </button>
        )}
      </div>
    </section>
  );
};

export default SubscriptionsPage;
