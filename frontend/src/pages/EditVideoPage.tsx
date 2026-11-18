import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { isUnauthorized, toApiError } from '../auth/authApi';
import { useAuth } from '../auth/authContext';
import { useTranslation } from '../i18n/i18nContext';
import type { Language } from '../settings/settings';
import VideoMetadataFields from '../components/VideoMetadataFields';
import { formatDuration } from '../utils/formatDuration';
import { validateMetadata, type FieldErrors, type VideoMetadataValues } from '../videos/videoMetadata';
import { useVideoDetail } from '../videos/useVideoDetail';
import { toMediaUrl, updateVideo, type VideoDetail } from '../videos/videosApi';
import NotFoundPage from './NotFoundPage';
// Same form layout as the upload page
import './UploadPage.css';

// English keeps the day-month-year order ("18 November 2026")
const formatDate = (isoDate: string, language: Language) =>
  new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoDate));

/**
 * US-07: page to edit the title, description, tags, category and age restriction of one of my videos, at
 * /videos/:id/edit. Visitors who are not logged in are sent to the login page; other users see that the video is not
 * theirs (the backend denies the change too).
 */
const EditVideoPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const videoId = Number(id);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!Number.isInteger(videoId) || videoId < 1) {
    return <NotFoundPage title={t('upload.videoNotFound')} />;
  }
  return <EditVideo key={videoId} id={videoId} username={user.username} />;
};

const EditVideo = ({ id, username }: { id: number; username: string }) => {
  const { video, status, retry } = useVideoDetail(id);
  const { t } = useTranslation();

  if (status === 'not-found') {
    return <NotFoundPage title={t('upload.videoNotFound')} />;
  }
  if (status === 'error') {
    return (
      <div role="alert" className="alert alert-danger d-flex align-items-center gap-3">
        <span>{t('upload.loadError')}</span>
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={retry}>
          {t('upload.retry')}
        </button>
      </div>
    );
  }
  if (status === 'loading' || !video) {
    return (
      <p role="status" className="text-muted">
        {t('upload.loadingVideo')}
      </p>
    );
  }
  if (video.uploader !== username) {
    return (
      <section className="upload-page text-start">
        <div role="alert" className="upload-error-card">
          <p className="mb-2">{t('upload.notOwner')}</p>
          <Link to={`/videos/${id}`} className="btn btn-primary">
            {t('upload.backToVideo')}
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
  const { t, language } = useTranslation();
  const [original] = useState(() => initialValues(video));
  const [values, setValues] = useState(original);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const changed = JSON.stringify(values) !== JSON.stringify(original);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateMetadata(values, language);
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
        setSubmitError(t('upload.sessionExpiredSave'));
        return;
      }
      const apiError = toApiError(error, language);
      setErrors(apiError.fieldErrors);
      setSubmitError(apiError.message);
    }
  };

  return (
    <section className="upload-page text-start">
      <header className="upload-header">
        <h1>{t('upload.editTitle')}</h1>
        <p className="text-muted mb-0">{t('upload.editSubtitle')}</p>
      </header>

      <form className="upload-layout" noValidate onSubmit={handleSubmit} aria-busy={saving}>
        <div className="upload-main">
          <h2 className="section-label">{t('upload.details')}</h2>
          <VideoMetadataFields
            values={values}
            onChange={(changes) => setValues((current) => ({ ...current, ...changes }))}
            errors={errors}
          />
        </div>

        <aside className="upload-aside">
          <div className="upload-preview">
            <img
              src={toMediaUrl(video.thumbnailUrl)}
              alt={t('upload.thumbnailOf', { title: video.title })}
              className="edit-thumbnail"
            />
            <dl className="upload-file-facts">
              <div>
                <dt>{t('upload.videoLink')}</dt>
                <dd>
                  <Link to={`/videos/${video.id}`}>/videos/{video.id}</Link>
                </dd>
              </div>
              <div>
                <dt>{t('upload.published')}</dt>
                <dd>
                  <time dateTime={video.publishedAt}>{formatDate(video.publishedAt, language)}</time>
                </dd>
              </div>
              <div>
                <dt>{t('upload.duration')}</dt>
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
            {t('upload.cancel')}
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving || !changed}>
            {saving ? t('upload.saving') : t('upload.save')}
          </button>
        </footer>
      </form>
    </section>
  );
};

export default EditVideoPage;
