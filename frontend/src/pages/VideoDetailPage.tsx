import { useParams } from 'react-router-dom';
import CommentList from '../components/CommentList';
import { useVideoDetail } from '../videos/useVideoDetail';
import { toMediaUrl } from '../videos/videosApi';
import NotFoundPage from './NotFoundPage';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * US-05: plays a video and shows its title, author, date, description and comments. The route is /videos/:id.
 */
const VideoDetailPage = () => {
  const { id } = useParams();
  const videoId = Number(id);

  // Not a valid id (e.g. /videos/abc): it cannot exist, so there is nothing to request
  if (!Number.isInteger(videoId) || videoId < 1) {
    return <NotFoundPage title="Video not found" />;
  }
  // The key resets the state when moving from one video to another
  return <VideoDetail key={videoId} id={videoId} />;
};

const VideoDetail = ({ id }: { id: number }) => {
  const { video, status, retry } = useVideoDetail(id);

  if (status === 'not-found') {
    return <NotFoundPage title="Video not found" />;
  }
  if (status === 'error') {
    return (
      <div role="alert" className="alert alert-danger d-flex align-items-center gap-3">
        <span>Could not load the video.</span>
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={retry}>
          Retry
        </button>
      </div>
    );
  }
  if (status === 'loading' || !video) {
    return (
      <p role="status" className="text-muted">
        Loading video...
      </p>
    );
  }

  return (
    <article className="text-start video-detail">
      <video
        className="w-100 rounded video-player"
        src={toMediaUrl(video.videoUrl)}
        poster={toMediaUrl(video.thumbnailUrl)}
        aria-label={`Video player: ${video.title}`}
        controls
        autoPlay
      />

      <h1 className="h4 mt-3">{video.title}</h1>
      <p className="text-muted small">
        {video.author && <span>{video.author} · </span>}
        <time dateTime={video.publishedAt}>{dateFormat.format(new Date(video.publishedAt))}</time>
      </p>

      {video.description && <p className="video-description">{video.description}</p>}

      <CommentList comments={video.comments} />
    </article>
  );
};

export default VideoDetailPage;
