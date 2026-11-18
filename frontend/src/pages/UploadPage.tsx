import { useEffect, useId, useState, type DragEvent, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isUnauthorized, toApiError } from '../auth/authApi';
import { useAuth } from '../auth/authContext';
import { useTranslation } from '../i18n/i18nContext';
import type { TranslateFn } from '../i18n/translate';
import type { Language } from '../settings/settings';
import { MAX_TAGS } from '../components/TagInput';
import VideoMetadataFields from '../components/VideoMetadataFields';
import { formatDuration } from '../utils/formatDuration';
import { validateMetadata, type FieldErrors, type VideoMetadataValues } from '../videos/videoMetadata';
import { useObjectUrl } from '../videos/useObjectUrl';
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  checkThumbnailFile,
  checkVideoFile,
  readVideoFile,
  titleFromFileName,
  type VideoFileInfo,
} from '../videos/videoFile';
import { uploadVideo } from '../videos/videosApi';
import './UploadPage.css';

// Index of one of the frames taken from the video, or the image chosen by the user
type ThumbnailChoice = number | 'custom';

function formatSize(bytes: number, language: Language, t: TranslateFn): string {
  if (bytes >= 1024 * 1024) {
    const megabytes = new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return t('upload.sizeMb', { size: megabytes.format(bytes / (1024 * 1024)) });
  }
  return t('upload.sizeKb', { size: Math.max(1, Math.round(bytes / 1024)) });
}

/**
 * US-06: page to upload a video, at /upload. Visitors who are not logged in are sent to the login page and come back
 * here afterwards.
 */
const UploadPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <UploadForm />;
};

const UploadForm = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const choose = (chosen: File | undefined) => {
    if (!chosen) return;
    const error = checkVideoFile(chosen, language);
    setFileError(error);
    setFile(error ? null : chosen);
  };

  if (!file) {
    return (
      <section className="upload-page text-start">
        <UploadHeader />
        <Dropzone onFile={choose} error={fileError} />
      </section>
    );
  }
  return (
    <section className="upload-page text-start">
      <UploadHeader />
      <VideoDetailsForm
        // A new file starts a new form
        key={`${file.name}-${file.size}-${file.lastModified}`}
        file={file}
        onReplace={() => setFile(null)}
        onPublished={(id) => navigate(`/videos/${id}`)}
      />
    </section>
  );
};

const UploadHeader = () => {
  const { t } = useTranslation();
  return (
    <header className="upload-header">
      <h1>{t('upload.title')}</h1>
      <p className="text-muted mb-0">{t('upload.subtitle')}</p>
    </header>
  );
};

const Dropzone = ({ onFile, error }: { onFile: (file: File | undefined) => void; error: string | null }) => {
  const { t } = useTranslation();
  const inputId = useId();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    onFile(event.dataTransfer.files[0]);
  };

  return (
    <>
      <label
        htmlFor={inputId}
        className={`upload-dropzone${dragging ? ' is-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="upload-dropzone-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="40" height="40">
            <path
              fill="currentColor"
              d="M5 20h14v-2H5v2zm7-18-5.5 5.5 1.41 1.41L11 5.83V16h2V5.83l3.09 3.08 1.41-1.41L12 2z"
            />
          </svg>
        </span>
        <strong>{t('upload.dropTitle')}</strong>
        <span className="text-muted">{t('upload.dropHint')}</span>
        <span className="btn btn-primary mt-2">{t('upload.selectFile')}</span>
        <input
          id={inputId}
          type="file"
          className="visually-hidden"
          accept={ACCEPTED_VIDEO_TYPES.join(',')}
          aria-label={t('upload.selectFileLabel')}
          onChange={(event) => onFile(event.target.files?.[0])}
        />
      </label>
      {error && (
        <p role="alert" className="upload-error mt-3">
          {error}
        </p>
      )}
    </>
  );
};

type FormProps = {
  file: File;
  onReplace: () => void;
  onPublished: (id: number) => void;
};

const VideoDetailsForm = ({ file, onReplace, onPublished }: FormProps) => {
  const { t, language } = useTranslation();
  const previewUrl = useObjectUrl(file);
  const [info, setInfo] = useState<VideoFileInfo | null>(null);
  const [readFailed, setReadFailed] = useState(false);

  const [values, setValues] = useState<VideoMetadataValues>(() => ({
    title: titleFromFileName(file.name),
    description: '',
    tags: [],
    category: '',
    ageRestricted: false,
  }));
  const [thumbnail, setThumbnail] = useState<ThumbnailChoice>(0);
  const [customThumbnail, setCustomThumbnail] = useState<File | null>(null);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const uploading = progress !== null;

  useEffect(() => {
    let cancelled = false;
    readVideoFile(file)
      .then((result) => {
        if (cancelled) return;
        setInfo(result);
        if (result.frames.length === 0) setThumbnail('custom');
      })
      .catch(() => {
        if (!cancelled) setReadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const chosenThumbnail = thumbnail === 'custom' ? customThumbnail : (info?.frames[thumbnail] ?? null);

  const chooseCustomThumbnail = (chosen: File | undefined) => {
    if (!chosen) return;
    const error = checkThumbnailFile(chosen, language);
    setErrors((current) => {
      const next = { ...current };
      delete next.thumbnail;
      return error ? { ...next, thumbnail: error } : next;
    });
    if (!error) {
      setCustomThumbnail(chosen);
      setThumbnail('custom');
    }
  };

  const validate = (): FieldErrors => {
    const found = validateMetadata(values, language);
    if (!chosenThumbnail) found.thumbnail = t('upload.chooseThumbnail');
    return found;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0 || !chosenThumbnail || !info) return;

    setProgress(0);
    try {
      const video = await uploadVideo(
        {
          title: values.title.trim(),
          description: values.description,
          tags: values.tags,
          category: values.category || null,
          ageRestricted: values.ageRestricted,
          durationSeconds: info.durationSeconds,
          width: info.width,
          height: info.height,
        },
        file,
        chosenThumbnail,
        setProgress
      );
      onPublished(video.id);
    } catch (error: unknown) {
      setProgress(null);
      if (isUnauthorized(error)) {
        setSubmitError(t('upload.sessionExpiredPublish'));
        return;
      }
      const apiError = toApiError(error, language);
      setErrors(apiError.fieldErrors);
      setSubmitError(apiError.message);
    }
  };

  if (readFailed) {
    return (
      <div role="alert" className="upload-error-card">
        <p className="mb-2">
          {t('upload.readFailedBefore')}
          <strong>{file.name}</strong>
          {t('upload.readFailedAfter')}
        </p>
        <button type="button" className="btn btn-primary" onClick={onReplace}>
          {t('upload.chooseAnotherFile')}
        </button>
      </div>
    );
  }

  return (
    <form className="upload-layout" noValidate onSubmit={handleSubmit} aria-busy={uploading}>
      <div className="upload-main">
        <h2 className="section-label">{t('upload.details')}</h2>

        <VideoMetadataFields
          values={values}
          onChange={(changes) => setValues((current) => ({ ...current, ...changes }))}
          errors={errors}
          afterDescription={
            <fieldset className="upload-field">
              <legend className="form-label">{t('upload.thumbnail')}</legend>
              <p className="text-muted small mb-2">{t('upload.thumbnailHint')}</p>
              <div className="thumbnail-options">
                {info === null && (
                  <p role="status" className="text-muted small mb-0">
                    {t('upload.generatingThumbnails')}
                  </p>
                )}
                {info?.frames.map((frame, index) => (
                  <ThumbnailOption
                    // The frames never change for a file, so their position is a stable key
                    key={index}
                    blob={frame}
                    label={t('upload.frame', { number: index + 1 })}
                    ariaLabel={t('upload.useFrame', { number: index + 1 })}
                    selected={thumbnail === index}
                    onSelect={() => setThumbnail(index)}
                  />
                ))}
                {customThumbnail && (
                  <ThumbnailOption
                    blob={customThumbnail}
                    label={t('upload.yourImage')}
                    ariaLabel={t('upload.useYourImage')}
                    selected={thumbnail === 'custom'}
                    onSelect={() => setThumbnail('custom')}
                  />
                )}
                <label className="thumbnail-upload">
                  <span aria-hidden="true">+</span>
                  {customThumbnail ? t('upload.changeImage') : t('upload.uploadImage')}
                  <input
                    type="file"
                    className="visually-hidden"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    aria-label={t('upload.uploadThumbnailLabel')}
                    onChange={(event) => chooseCustomThumbnail(event.target.files?.[0])}
                  />
                </label>
              </div>
              {errors.thumbnail && <p className="invalid-text mt-2 mb-0">{errors.thumbnail}</p>}
            </fieldset>
          }
        />
      </div>

      <aside className="upload-aside">
        <div className="upload-preview">
          {previewUrl && <video src={previewUrl} controls muted aria-label={t('upload.previewLabel')} />}
          <dl className="upload-file-facts">
            <div>
              <dt>{t('upload.fileName')}</dt>
              <dd>{file.name}</dd>
            </div>
            <div>
              <dt>{t('upload.size')}</dt>
              <dd>{formatSize(file.size, language, t)}</dd>
            </div>
            {info && (
              <div>
                <dt>{t('upload.duration')}</dt>
                <dd>
                  {formatDuration(info.durationSeconds)}
                  {info.width && info.height ? ` · ${info.width}×${info.height}` : ''}
                </dd>
              </div>
            )}
            <div>
              <dt>{t('upload.tags')}</dt>
              <dd>
                {values.tags.length}/{MAX_TAGS}
              </dd>
            </div>
          </dl>
          <button type="button" className="btn btn-outline-secondary btn-sm" disabled={uploading} onClick={onReplace}>
            {t('upload.chooseAnotherFile')}
          </button>
        </div>
      </aside>

      <footer className="upload-actions">
        {uploading ? (
          <div className="upload-progress">
            <progress max={1} value={progress} aria-label={t('upload.progressLabel')} />
            <span role="status">{t('upload.uploading', { percent: Math.round(progress * 100) })}</span>
          </div>
        ) : (
          submitError && (
            <p role="alert" className="upload-error mb-0">
              {submitError}
            </p>
          )
        )}
        <button type="submit" className="btn btn-primary" disabled={uploading || info === null}>
          {uploading ? t('upload.publishing') : t('upload.publish')}
        </button>
      </footer>
    </form>
  );
};

type ThumbnailOptionProps = {
  blob: Blob;
  label: string;
  // Accessible name, e.g. "Use frame 1 as thumbnail"
  ariaLabel: string;
  selected: boolean;
  onSelect: () => void;
};

const ThumbnailOption = ({ blob, label, ariaLabel, selected, onSelect }: ThumbnailOptionProps) => {
  const url = useObjectUrl(blob);
  return (
    <button
      type="button"
      className={`thumbnail-option${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
    >
      {url && <img src={url} alt="" />}
      <span>{label}</span>
    </button>
  );
};

export default UploadPage;
