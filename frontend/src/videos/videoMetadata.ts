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
 * Errors of the fields the browser can check before sending the form; the backend applies the same rules.
 */
export function validateMetadata(values: VideoMetadataValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.title.trim()) errors.title = 'Title is required';
  else if (values.title.length > MAX_TITLE) errors.title = `Title must be at most ${MAX_TITLE} characters`;
  if (values.description.length > MAX_DESCRIPTION) {
    errors.description = `Description must be at most ${MAX_DESCRIPTION} characters`;
  }
  return errors;
}
