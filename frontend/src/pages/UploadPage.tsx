import { useEffect, useId, useState, type DragEvent, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isUnauthorized, toApiError } from '../auth/authApi';
import { useAuth } from '../auth/authContext';
import TagInput, { MAX_TAGS } from '../components/TagInput';
import { extractHashtags } from '../utils/hashtags';
import { formatDuration } from '../utils/formatDuration';
import { VIDEO_CATEGORIES, type VideoCategory } from '../videos/categories';
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

// Same limits as UploadVideoRequest in the backend
export const MAX_TITLE = 100;
export const MAX_DESCRIPTION = 5000;

type FieldErrors = Record<string, string>;
// Index of one of the frames taken from the video, or the image chosen by the user
type ThumbnailChoice = number | 'custom';

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
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
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const choose = (chosen: File | undefined) => {
    if (!chosen) return;
    const error = checkVideoFile(chosen);
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

const UploadHeader = () => (
  <header className="upload-header">
    <h1>Upload video</h1>
    <p className="text-muted mb-0">Share a video with the ProTube community. MP4 or WebM, up to 100 MB.</p>
  </header>
);

const Dropzone = ({ onFile, error }: { onFile: (file: File | undefined) => void; error: string | null }) => {
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
        <strong>Drag and drop a video file to upload</strong>
        <span className="text-muted">Your video stays private until you publish it.</span>
        <span className="btn btn-primary mt-2">Select file</span>
        <input
          id={inputId}
          type="file"
          className="visually-hidden"
          accept={ACCEPTED_VIDEO_TYPES.join(',')}
          aria-label="Select video file"
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
  const ids = useId();
  const previewUrl = useObjectUrl(file);
  const [info, setInfo] = useState<VideoFileInfo | null>(null);
  const [readFailed, setReadFailed] = useState(false);

  const [title, setTitle] = useState(() => titleFromFileName(file.name));
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState<VideoCategory | ''>('');
  const [ageRestricted, setAgeRestricted] = useState(false);
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

  const hashtags = extractHashtags(description);
  const chosenThumbnail = thumbnail === 'custom' ? customThumbnail : (info?.frames[thumbnail] ?? null);

  const chooseCustomThumbnail = (chosen: File | undefined) => {
    if (!chosen) return;
    const error = checkThumbnailFile(chosen);
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
    const found: FieldErrors = {};
    if (!title.trim()) found.title = 'Title is required';
    else if (title.length > MAX_TITLE) found.title = `Title must be at most ${MAX_TITLE} characters`;
    if (description.length > MAX_DESCRIPTION) {
      found.description = `Description must be at most ${MAX_DESCRIPTION} characters`;
    }
    if (!chosenThumbnail) found.thumbnail = 'Choose a thumbnail for your video';
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
          title: title.trim(),
          description,
          tags,
          category: category || null,
          ageRestricted,
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
        setSubmitError('Your session has expired. Log in again to publish your video.');
        return;
      }
      const apiError = toApiError(error);
      setErrors(apiError.fieldErrors);
      setSubmitError(apiError.message);
    }
  };

  if (readFailed) {
    return (
      <div role="alert" className="upload-error-card">
        <p className="mb-2">
          We could not read <strong>{file.name}</strong>. Try another MP4 or WebM video.
        </p>
        <button type="button" className="btn btn-primary" onClick={onReplace}>
          Choose another file
        </button>
      </div>
    );
  }

  return (
    <form className="upload-layout" noValidate onSubmit={handleSubmit} aria-busy={uploading}>
      <div className="upload-main">
        <h2 className="section-label">Details</h2>

        <div className="upload-field">
          <label htmlFor={`${ids}-title`} className="form-label">
            Title (required)
          </label>
          <input
            id={`${ids}-title`}
            className={`form-control${errors.title ? ' is-invalid' : ''}`}
            value={title}
            maxLength={MAX_TITLE}
            placeholder="Add a title that describes your video"
            aria-describedby={`${ids}-title-hint`}
            aria-invalid={Boolean(errors.title)}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div id={`${ids}-title-hint`} className="form-hint">
            <span className="invalid-text">{errors.title}</span>
            <span>
              {title.length}/{MAX_TITLE}
            </span>
          </div>
        </div>

        <div className="upload-field">
          <label htmlFor={`${ids}-description`} className="form-label">
            Description
          </label>
          <textarea
            id={`${ids}-description`}
            className={`form-control${errors.description ? ' is-invalid' : ''}`}
            rows={6}
            value={description}
            maxLength={MAX_DESCRIPTION}
            placeholder="Tell viewers about your video. Add #hashtags so people can find it."
            aria-describedby={`${ids}-description-hint`}
            aria-invalid={Boolean(errors.description)}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div id={`${ids}-description-hint`} className="form-hint">
            <span className="invalid-text">{errors.description}</span>
            <span>
              {description.length}/{MAX_DESCRIPTION}
            </span>
          </div>
          {hashtags.length > 0 && (
            <p className="upload-hashtags">
              <span className="text-muted">Hashtags: </span>
              {hashtags.map((tag) => (
                <span key={tag} className="hashtag-chip">
                  #{tag}
                </span>
              ))}
            </p>
          )}
        </div>

        <fieldset className="upload-field">
          <legend className="form-label">Thumbnail</legend>
          <p className="text-muted small mb-2">
            Pick a frame from your video or upload an image (JPG, PNG or WebP, 2 MB max).
          </p>
          <div className="thumbnail-options">
            {info === null && (
              <p role="status" className="text-muted small mb-0">
                Generating thumbnails...
              </p>
            )}
            {info?.frames.map((frame, index) => (
              <ThumbnailOption
                // The frames never change for a file, so their position is a stable key
                key={index}
                blob={frame}
                label={`Frame ${index + 1}`}
                selected={thumbnail === index}
                onSelect={() => setThumbnail(index)}
              />
            ))}
            {customThumbnail && (
              <ThumbnailOption
                blob={customThumbnail}
                label="Your image"
                selected={thumbnail === 'custom'}
                onSelect={() => setThumbnail('custom')}
              />
            )}
            <label className="thumbnail-upload">
              <span aria-hidden="true">+</span>
              {customThumbnail ? 'Change image' : 'Upload image'}
              <input
                type="file"
                className="visually-hidden"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                aria-label="Upload thumbnail image"
                onChange={(event) => chooseCustomThumbnail(event.target.files?.[0])}
              />
            </label>
          </div>
          {errors.thumbnail && <p className="invalid-text mt-2 mb-0">{errors.thumbnail}</p>}
        </fieldset>

        <div className="upload-field">
          <TagInput tags={tags} onChange={setTags} error={errors.tags} />
        </div>

        <div className="upload-field">
          <label htmlFor={`${ids}-category`} className="form-label">
            Category
          </label>
          <select
            id={`${ids}-category`}
            className="form-select"
            value={category}
            onChange={(event) => setCategory(event.target.value as VideoCategory | '')}
          >
            <option value="">No category</option>
            {VIDEO_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="upload-field">
          <legend className="form-label">Age restriction</legend>
          <p className="text-muted small mb-2">
            Age-restricted videos are only shown to logged-in viewers who confirm they are over 18.
          </p>
          <div className="form-check">
            <input
              id={`${ids}-age-no`}
              className="form-check-input"
              type="radio"
              name="ageRestricted"
              checked={!ageRestricted}
              onChange={() => setAgeRestricted(false)}
            />
            <label htmlFor={`${ids}-age-no`} className="form-check-label">
              No, it is suitable for everyone
            </label>
          </div>
          <div className="form-check">
            <input
              id={`${ids}-age-yes`}
              className="form-check-input"
              type="radio"
              name="ageRestricted"
              checked={ageRestricted}
              onChange={() => setAgeRestricted(true)}
            />
            <label htmlFor={`${ids}-age-yes`} className="form-check-label">
              Yes, restrict my video to viewers over 18
            </label>
          </div>
        </fieldset>
      </div>

      <aside className="upload-aside">
        <div className="upload-preview">
          {previewUrl && <video src={previewUrl} controls muted aria-label="Preview of your video" />}
          <dl className="upload-file-facts">
            <div>
              <dt>File name</dt>
              <dd>{file.name}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatSize(file.size)}</dd>
            </div>
            {info && (
              <div>
                <dt>Duration</dt>
                <dd>
                  {formatDuration(info.durationSeconds)}
                  {info.width && info.height ? ` · ${info.width}×${info.height}` : ''}
                </dd>
              </div>
            )}
            <div>
              <dt>Tags</dt>
              <dd>
                {tags.length}/{MAX_TAGS}
              </dd>
            </div>
          </dl>
          <button type="button" className="btn btn-outline-secondary btn-sm" disabled={uploading} onClick={onReplace}>
            Choose another file
          </button>
        </div>
      </aside>

      <footer className="upload-actions">
        {uploading ? (
          <div className="upload-progress">
            <progress max={1} value={progress} aria-label="Upload progress" />
            <span role="status">Uploading... {Math.round(progress * 100)}%</span>
          </div>
        ) : (
          submitError && (
            <p role="alert" className="upload-error mb-0">
              {submitError}
            </p>
          )
        )}
        <button type="submit" className="btn btn-primary" disabled={uploading || info === null}>
          {uploading ? 'Publishing...' : 'Publish'}
        </button>
      </footer>
    </form>
  );
};

type ThumbnailOptionProps = {
  blob: Blob;
  label: string;
  selected: boolean;
  onSelect: () => void;
};

const ThumbnailOption = ({ blob, label, selected, onSelect }: ThumbnailOptionProps) => {
  const url = useObjectUrl(blob);
  return (
    <button
      type="button"
      className={`thumbnail-option${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      aria-label={`Use ${label.toLowerCase()} as thumbnail`}
      onClick={onSelect}
    >
      {url && <img src={url} alt="" />}
      <span>{label}</span>
    </button>
  );
};

export default UploadPage;
