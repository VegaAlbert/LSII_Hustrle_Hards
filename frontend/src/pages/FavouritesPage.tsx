import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import VideoCard from '../components/VideoCard';
import { useFavourites } from '../favourites/useFavourites';

/**
 * US-12: favourite videos of the logged-in user, at /favourites, last saved first. Visitors who are not logged in are
 * sent to the login page and come back here afterwards.
 */
const FavouritesPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <FavouritesList />;
};

// Separate component so the list is only requested for logged-in users (hooks cannot be called conditionally)
const FavouritesList = () => {
  const { videos, status, hasMore, loadMore, retry } = useFavourites();

  return (
    <section aria-labelledby="favourites-title" className="text-start">
      <h1 id="favourites-title" className="section-title mb-4">
        Favourites
      </h1>

      {status === 'success' && videos.length === 0 && (
        <div className="favourites-empty">
          <p className="mb-2">You have no favourite videos yet.</p>
          <p className="mb-3">Use “Save to favourites” on a video to watch it later.</p>
          <Link to="/" className="btn btn-primary btn-sm">
            Browse videos
          </Link>
        </div>
      )}

      {videos.length > 0 && (
        <ul
          aria-label="Favourite videos"
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
            Loading favourites...
          </p>
        )}
        {status === 'error' && (
          <div role="alert" className="alert alert-danger d-flex align-items-center gap-3 mb-0">
            <span>Could not load your favourites.</span>
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

export default FavouritesPage;
