import { useVideoList } from '../videos/useVideoList';
import VideoCard from './VideoCard';

// Placeholders shown while the first page loads; fixed ids because they never change
const SKELETON_IDS = Array.from({ length: 8 }, (_, index) => `skeleton-${index}`);

type Props = {
  // US-08: when not empty, only the videos matching it, most relevant first
  query?: string;
};

/**
 * US-04: home page list of videos, newest first, with a "Load more" button for the next pages.
 */
const VideoGrid = ({ query = '' }: Props) => {
  const { videos, status, hasMore, loadMore, retry } = useVideoList(query);

  if (status === 'success' && videos.length === 0) {
    return <p className="text-muted">{query ? `No videos match "${query}".` : 'No videos available yet.'}</p>;
  }

  return (
    <section>
      {videos.length > 0 && (
        <ul
          aria-label={query ? `Results for "${query}"` : 'Videos'}
          className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4 list-unstyled video-grid"
        >
          {videos.map((video) => (
            <li key={video.id} className="col">
              <VideoCard video={video} />
            </li>
          ))}
        </ul>
      )}

      {status === 'loading' && videos.length === 0 && (
        <ul className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4 list-unstyled" aria-hidden="true">
          {SKELETON_IDS.map((id) => (
            <li key={id} className="col">
              <div className="video-card-skeleton">
                <div className="skeleton-thumbnail" />
                <div className="skeleton-line" />
                <div className="skeleton-line is-short" />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="d-flex flex-column align-items-center gap-2 my-4">
        {status === 'loading' && (
          <p role="status" className={videos.length === 0 ? 'visually-hidden' : 'text-muted mb-0'}>
            Loading videos...
          </p>
        )}
        {status === 'error' && (
          <div role="alert" className="alert alert-danger d-flex align-items-center gap-3 mb-0">
            <span>Could not load the videos.</span>
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

export default VideoGrid;
