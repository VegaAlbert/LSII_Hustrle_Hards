import { Link } from 'react-router-dom';
import { formatDuration } from '../utils/formatDuration';
import { toMediaUrl, type VideoSummary } from '../videos/videosApi';

type Props = {
  video: VideoSummary;
};

const VideoCard = ({ video }: Props) => (
  <article className="card h-100 video-card">
    <div className="position-relative">
      <img src={toMediaUrl(video.thumbnailUrl)} alt={video.title} className="card-img-top video-card-thumbnail" />
      <time
        className="badge bg-dark position-absolute bottom-0 end-0 m-2"
        dateTime={`PT${Math.round(video.durationSeconds)}S`}
      >
        {formatDuration(video.durationSeconds)}
      </time>
    </div>
    <div className="card-body text-start">
      <h2 className="card-title h6 video-card-title">
        {/* stretched-link makes the whole card clickable */}
        <Link to={`/videos/${video.id}`} className="stretched-link text-reset text-decoration-none">
          {video.title}
        </Link>
      </h2>
      {video.author && <p className="card-text text-muted small mb-0">{video.author}</p>}
    </div>
  </article>
);

export default VideoCard;
