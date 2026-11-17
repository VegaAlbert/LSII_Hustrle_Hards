import { useId, type ReactNode } from 'react';
import TagInput from './TagInput';
import { extractHashtags } from '../utils/hashtags';
import { VIDEO_CATEGORIES, type VideoCategory } from '../videos/categories';
import { MAX_DESCRIPTION, MAX_TITLE, type FieldErrors, type VideoMetadataValues } from '../videos/videoMetadata';

type Props = {
  values: VideoMetadataValues;
  onChange: (changes: Partial<VideoMetadataValues>) => void;
  errors: FieldErrors;
  // Extra fields shown after the description, e.g. the thumbnail picker of the upload page
  afterDescription?: ReactNode;
};

/**
 * Title, description (with its #hashtags), tags, category and age restriction of a video. Shared by the upload page
 * (US-06) and the edit page (US-07), so both forms look and validate the same.
 */
const VideoMetadataFields = ({ values, onChange, errors, afterDescription }: Props) => {
  const ids = useId();
  const hashtags = extractHashtags(values.description);

  return (
    <>
      <div className="upload-field">
        <label htmlFor={`${ids}-title`} className="form-label">
          Title (required)
        </label>
        <input
          id={`${ids}-title`}
          className={`form-control${errors.title ? ' is-invalid' : ''}`}
          value={values.title}
          maxLength={MAX_TITLE}
          placeholder="Add a title that describes your video"
          aria-describedby={`${ids}-title-hint`}
          aria-invalid={Boolean(errors.title)}
          onChange={(event) => onChange({ title: event.target.value })}
        />
        <div id={`${ids}-title-hint`} className="form-hint">
          <span className="invalid-text">{errors.title}</span>
          <span>
            {values.title.length}/{MAX_TITLE}
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
          value={values.description}
          maxLength={MAX_DESCRIPTION}
          placeholder="Tell viewers about your video. Add #hashtags so people can find it."
          aria-describedby={`${ids}-description-hint`}
          aria-invalid={Boolean(errors.description)}
          onChange={(event) => onChange({ description: event.target.value })}
        />
        <div id={`${ids}-description-hint`} className="form-hint">
          <span className="invalid-text">{errors.description}</span>
          <span>
            {values.description.length}/{MAX_DESCRIPTION}
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

      {afterDescription}

      <div className="upload-field">
        <TagInput tags={values.tags} onChange={(tags) => onChange({ tags })} error={errors.tags} />
      </div>

      <div className="upload-field">
        <label htmlFor={`${ids}-category`} className="form-label">
          Category
        </label>
        <select
          id={`${ids}-category`}
          className="form-select"
          value={values.category}
          onChange={(event) => onChange({ category: event.target.value as VideoCategory | '' })}
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
            name={`${ids}-age`}
            checked={!values.ageRestricted}
            onChange={() => onChange({ ageRestricted: false })}
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
            name={`${ids}-age`}
            checked={values.ageRestricted}
            onChange={() => onChange({ ageRestricted: true })}
          />
          <label htmlFor={`${ids}-age-yes`} className="form-check-label">
            Yes, restrict my video to viewers over 18
          </label>
        </div>
      </fieldset>
    </>
  );
};

export default VideoMetadataFields;
