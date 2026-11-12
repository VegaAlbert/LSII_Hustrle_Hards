import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { isUnauthorized, toApiError } from '../auth/authApi';
import { useAuth } from '../auth/authContext';
import VideoMetadataFields from '../components/VideoMetadataFields';
import { formatDuration } from '../utils/formatDuration';
import { validateMetadata, type FieldErrors, type VideoMetadataValues } from '../videos/videoMetadata';
import { useVideoDetail } from '../videos/useVideoDetail';
import { toMediaUrl, updateVideo, type VideoDetail } from '../videos/videosApi';
import NotFoundPage from './NotFoundPage';
// Same form layout as the upload page
import './UploadPage.css';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * US-07: page to edit the title, description, tags, category and age restriction of one of my videos, at
 * /videos/:id/edit. Visitors who are not logged in are sent to the login page; other users see that the video is not
 * theirs (the backend denies the change too).
 */
const EditVideoPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const videoId = Number(id);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!Number.isInteger(videoId) || videoId < 1) {
    return <NotFoundPage title="Video not found" />;
  }
  return <EditVideo key={videoId} id={videoId} username={user.username} />;
};

const EditVideo = ({ id, username }: { id: number; username: string }) => {
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
  if (video.uploader !== username) {
    return (
      <section className="upload-page text-start">
        <div role="alert" className="upload-error-card">
          <p className="mb-2">You can only edit your own videos.</p>
          <Link to={`/videos/${id}`} className="btn btn-primary">
            Back to the video
          </Link>
        </div>
      </section>
    );
  }
  return <EditForm video={video} />;
};

const initialValues = (video: VideoDetail): VideoMetadataValues => ({
  title: video.title,
  description: video.description ?? '',
  tags: video.tags,
  category: video.category ?? '',
  ageRestricted: video.ageRestricted,
});

const EditForm = ({ video }: { video: VideoDetail }) => {
  const navigate = useNavigate();
  const [original] = useState(() => initialValues(video));
  const [values, setValues] = useState(original);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const changed = JSON.stringify(values) !== JSON.stringify(original);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateMetadata(values);
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await updateVideo(video.id, {
        title: values.title.trim(),
        description: values.description,
        tags: values.tags,
        category: values.category || null,
        ageRestricted: values.ageRestricted,
      });
      navigate(`/videos/${video.id}`);
    } catch (error: unknown) {
      setSaving(false);
      if (isUnauthorized(error)) {
        setSubmitError('Your session has expired. Log in again to save your changes.');
        return;
      }
      const apiError = toApiError(error);
      setErrors(apiError.fieldErrors);
      setSubmitError(apiError.message);
    }
  };

  return (
    <section className="upload-page text-start">
      <header className="upload-header">
        <h1>Edit video</h1>
        <p className="text-muted mb-0">Change the details of your video. The video file and its date stay the same.</p>
      </header>

      <form className="upload-layout" noValidate onSubmit={handleSubmit} aria-busy={saving}>
        <div className="upload-main">
          <h2 className="section-label">Details</h2>
          <VideoMetadataFields
            values={values}
            onChange={(changes) => setValues((current) => ({ ...current, ...changes }))}
            errors={errors}
          />
        </div>

        <aside className="upload-aside">
          <div className="upload-preview">
            <img src={toMediaUrl(video.thumbnailUrl)} alt={`Thumbnail of ${video.title}`} className="edit-thumbnail" />
            <dl className="upload-file-facts">
              <div>
                <dt>Video link</dt>
                <dd>
                  <Link to={`/videos/${video.id}`}>/videos/{video.id}</Link>
                </dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>
                  <time dateTime={video.publishedAt}>{dateFormat.format(new Date(video.publishedAt))}</time>
                </dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{formatDuration(video.durationSeconds)}</dd>
              </div>
            </dl>
          </div>
        </aside>

        <footer className="upload-actions">
          {submitError && (
            <p role="alert" className="upload-error mb-0 me-auto">
              {submitError}
            </p>
          )}
          <Link to={`/videos/${video.id}`} className="btn btn-outline-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving || !changed}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </footer>
      </form>
    </section>
  );
};

export default EditVideoPage;
