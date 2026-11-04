import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { formatDuration } from '../utils/formatDuration';
import { formatRelativeTime } from '../utils/relativeTime';
import { toMediaUrl, type VideoSummary } from '../videos/videosApi';

// Wait a moment before the preview starts, so moving the mouse across the grid does not load every video
export const PREVIEW_DELAY_MS = 500;

type Props = {
  video: VideoSummary;
};

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Video in the home grid. Hovering it (or focusing its link) plays a muted preview over the thumbnail, with a bar
 * showing how far the preview has played.
 */
const VideoCard = ({ video }: Props) => {
  const [previewing, setPreviewing] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const startPreview = () => {
    if (prefersReducedMotion()) {
      return;
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPreviewing(true), PREVIEW_DELAY_MS);
  };

  const stopPreview = () => {
    window.clearTimeout(timer.current);
    setPreviewing(false);
    setProgress(0);
  };

  return (
    <article
      className={`video-card${previewing ? ' is-previewing' : ''}`}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocus={startPreview}
      onBlur={stopPreview}
    >
      <div className="video-card-media">
        <img src={toMediaUrl(video.thumbnailUrl)} alt={video.title} className="video-card-thumbnail" />
        {previewing && (
          <>
            <video
              className="video-card-preview"
              src={toMediaUrl(video.videoUrl)}
              muted
              autoPlay
              loop
              playsInline
              aria-hidden="true"
              data-testid="video-preview"
              onTimeUpdate={(event) => {
                const { currentTime, duration } = event.currentTarget;
                setProgress(duration ? currentTime / duration : 0);
              }}
            />
            <div className="video-card-progress" aria-hidden="true">
              <span style={{ width: `${progress * 100}%` }} />
            </div>
          </>
        )}
        <time className="badge video-card-duration" dateTime={`PT${Math.round(video.durationSeconds)}S`}>
          {formatDuration(video.durationSeconds)}
        </time>
      </div>
      <div className="video-card-body">
        {video.author && <Avatar name={video.author} size="sm" />}
        <div className="min-w-0">
          <h2 className="video-card-title">
            {/* stretched-link makes the whole card clickable */}
            <Link to={`/videos/${video.id}`} className="stretched-link">
              {video.title}
            </Link>
          </h2>
          {video.author && <p className="video-card-meta">{video.author}</p>}
          <p className="video-card-meta">
            <time dateTime={video.publishedAt}>{formatRelativeTime(video.publishedAt)}</time>
          </p>
        </div>
      </div>
    </article>
  );
};

export default VideoCard;
