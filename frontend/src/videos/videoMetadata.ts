import { translate } from '../i18n/translate';
import type { Language } from '../settings/settings';
import type { VideoCategory } from './categories';

// Same limits as UploadVideoRequest and UpdateVideoRequest in the backend
export const MAX_TITLE = 100;
export const MAX_DESCRIPTION = 5000;

export type VideoMetadataValues = {
  title: string;
  description: string;
  tags: string[];
  // '' while no category is chosen
  category: VideoCategory | '';
  ageRestricted: boolean;
};

export type FieldErrors = Record<string, string>;

/**
 * Errors, in the given language, of the fields the browser can check before sending the form; the backend applies
 * the same rules.
 */
export function validateMetadata(values: VideoMetadataValues, language: Language = 'en'): FieldErrors {
  const errors: FieldErrors = {};
  // Limits passed as text so they read "5000", like the backend message, and not "5,000"
  if (!values.title.trim()) errors.title = translate(language, 'upload.titleRequired');
  else if (values.title.length > MAX_TITLE) {
    errors.title = translate(language, 'upload.titleTooLong', { max: String(MAX_TITLE) });
  }
  if (values.description.length > MAX_DESCRIPTION) {
    errors.description = translate(language, 'upload.descriptionTooLong', { max: String(MAX_DESCRIPTION) });
  }
  return errors;
}
