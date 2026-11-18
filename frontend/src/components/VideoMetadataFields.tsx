import { useId, type ReactNode } from 'react';
import TagInput from './TagInput';
import { useTranslation } from '../i18n/i18nContext';
import { extractHashtags } from '../utils/hashtags';
import { categoryLabel, VIDEO_CATEGORIES, type VideoCategory } from '../videos/categories';
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
  const { t, language } = useTranslation();
  const ids = useId();
  const hashtags = extractHashtags(values.description);

  return (
    <>
      <div className="upload-field">
        <label htmlFor={`${ids}-title`} className="form-label">
          {t('upload.titleLabel')}
        </label>
        <input
          id={`${ids}-title`}
          className={`form-control${errors.title ? ' is-invalid' : ''}`}
          value={values.title}
          maxLength={MAX_TITLE}
          placeholder={t('upload.titlePlaceholder')}
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
          {t('upload.description')}
        </label>
        <textarea
          id={`${ids}-description`}
          className={`form-control${errors.description ? ' is-invalid' : ''}`}
          rows={6}
          value={values.description}
          maxLength={MAX_DESCRIPTION}
          placeholder={t('upload.descriptionPlaceholder')}
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
            <span className="text-muted">{t('upload.hashtags')}</span>
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
          {t('upload.category')}
        </label>
        <select
          id={`${ids}-category`}
          className="form-select"
          value={values.category}
          onChange={(event) => onChange({ category: event.target.value as VideoCategory | '' })}
        >
          <option value="">{t('upload.noCategory')}</option>
          {VIDEO_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {categoryLabel(item, language)}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="upload-field">
        <legend className="form-label">{t('upload.ageRestriction')}</legend>
        <p className="text-muted small mb-2">{t('upload.ageRestrictionHint')}</p>
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
            {t('upload.ageNo')}
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
            {t('upload.ageYes')}
          </label>
        </div>
      </fieldset>
    </>
  );
};

export default VideoMetadataFields;
