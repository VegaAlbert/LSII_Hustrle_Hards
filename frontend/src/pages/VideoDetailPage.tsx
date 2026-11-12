import { useRef, useState, type CSSProperties, type ReactElement } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import Avatar from '../components/Avatar';
import CommentList from '../components/CommentList';
import ExpandableText from '../components/ExpandableText';
import HashtagText from '../components/HashtagText';
import ShareDialog from '../components/ShareDialog';
import { formatDuration } from '../utils/formatDuration';
import { extractHashtags, hashtagSearchUrl } from '../utils/hashtags';
import { formatRelativeTime } from '../utils/relativeTime';
import { categoryLabel } from '../videos/categories';
import { useVideoDetail } from '../videos/useVideoDetail';
import { toMediaUrl, type VideoDetail as Video } from '../videos/videosApi';
import NotFoundPage from './NotFoundPage';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short' });
// YouTube shows the first three hashtags of the description above the title
const TITLE_HASHTAGS = 3;

/**
 * Second to start playing at, from a shared link such as /videos/5?t=90.
 */
function startTime(value: string | null): number {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
}

/**
 * US-05: plays a video and shows its title, author, date, description and comments. The route is /videos/:id.
 * US-06: also its hashtags, tags and category, a share dialog and, for age-restricted videos, a confirmation gate.
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
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const player = useRef<HTMLVideoElement>(null);
  // Second the player was at when "Share" was clicked; null while the dialog is closed
  const [sharingAt, setSharingAt] = useState<number | null>(null);
  const start = startTime(searchParams.get('t'));

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

  const titleHashtags = extractHashtags(video.description ?? '').slice(0, TITLE_HASHTAGS);
  const publishedAt = new Date(video.publishedAt);
  const hasAbout = Boolean(video.description) || video.tags.length > 0 || video.category || video.ageRestricted;

  return (
    <article className="text-start video-detail">
      <div className="video-frame">
        <AgeGate video={video}>
          <video
            ref={player}
            className="video-player"
            src={toMediaUrl(video.videoUrl)}
            poster={toMediaUrl(video.thumbnailUrl)}
            aria-label={`Video player: ${video.title}`}
            controls
            autoPlay
            onLoadedMetadata={(event) => {
              if (start > 0) event.currentTarget.currentTime = start;
            }}
          />
        </AgeGate>
      </div>

      {titleHashtags.length > 0 && (
        <p className="video-hashtags" aria-label="Hashtags">
          {titleHashtags.map((tag) => (
            <Link key={tag} to={hashtagSearchUrl(tag)}>
              #{tag}
            </Link>
          ))}
        </p>
      )}

      <h1 className="video-detail-title">{video.title}</h1>

      <div className="video-meta-row">
        <div className="video-meta">
          {video.author && <Avatar name={video.author} />}
          <div className="min-w-0">
            {video.author && <p className="video-author mb-0">{video.author}</p>}
            <p className="video-facts mb-0">
              <time dateTime={video.publishedAt} title={dateTimeFormat.format(publishedAt)}>
                {dateFormat.format(publishedAt)}
              </time>
              <span aria-hidden="true"> · </span>
              <span>{formatRelativeTime(video.publishedAt)}</span>
              <span aria-hidden="true"> · </span>
              <span>{formatDuration(video.durationSeconds)}</span>
            </p>
          </div>
        </div>
        <div className="video-actions">
          <button type="button" className="pill-btn" onClick={() => setSharingAt(player.current?.currentTime ?? 0)}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z" />
            </svg>
            Share
          </button>
          {/* US-07: only the user who uploaded the video can edit it */}
          {user && video.uploader === user.username && (
            <Link to={`/videos/${video.id}/edit`} className="pill-btn text-decoration-none">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z"
                />
              </svg>
              Edit video
            </Link>
          )}
        </div>
      </div>

      {hasAbout && (
        <section aria-labelledby="description-title" className="description-card">
          <h2 id="description-title" className="section-label">
            About this video
          </h2>
          {video.description && (
            <ExpandableText text={video.description} render={(text) => <HashtagText text={text} />} />
          )}
          {video.tags.length > 0 && (
            <ul className="video-tags" aria-label="Tags">
              {video.tags.map((tag) => (
                <li key={tag}>
                  <Link to={`/?q=${encodeURIComponent(tag)}`} className="video-tag">
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {(video.category || video.ageRestricted) && (
            <div className="video-badges">
              {video.category && <span className="video-tag">{categoryLabel(video.category)}</span>}
              {video.ageRestricted && <span className="age-badge">18+</span>}
            </div>
          )}
        </section>
      )}

      <CommentList comments={video.comments} />

      {sharingAt !== null && (
        <ShareDialog
          url={`${window.location.origin}/videos/${video.id}`}
          title={video.title}
          currentTime={sharingAt}
          onClose={() => setSharingAt(null)}
        />
      )}
    </article>
  );
};

/**
 * Covers an age-restricted video until the viewer confirms they are over 18; anonymous visitors must log in first.
 */
const AgeGate = ({ video, children }: { video: Video; children: ReactElement }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [confirmed, setConfirmed] = useState(false);

  if (!video.ageRestricted || (user && confirmed)) {
    return children;
  }
  const style = { '--age-gate-image': `url(${toMediaUrl(video.thumbnailUrl)})` } as CSSProperties;
  return (
    <div className="age-gate" style={style} role="region" aria-label="Age-restricted video">
      <span className="age-badge">18+</span>
      <h2>Age-restricted video</h2>
      {user ? (
        <>
          <p>This video may be inappropriate for some users. Confirm that you are over 18 to watch it.</p>
          <button type="button" className="btn btn-primary" onClick={() => setConfirmed(true)}>
            I am over 18, play the video
          </button>
        </>
      ) : (
        <>
          <p>This video may be inappropriate for some users. Log in to confirm your age.</p>
          <Link to="/login" state={{ from: `${location.pathname}${location.search}` }} className="btn btn-primary">
            Log in
          </Link>
        </>
      )}
    </div>
  );
};

export default VideoDetailPage;
