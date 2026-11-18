import { translate } from '../i18n/translate';
import type { Language } from '../settings/settings';

// Same values as the VideoCategory enum of the backend. Their labels live in src/i18n/messages/categories.ts
export const VIDEO_CATEGORIES = [
  'FILM_AND_ANIMATION',
  'AUTOS_AND_VEHICLES',
  'MUSIC',
  'PETS_AND_ANIMALS',
  'SPORTS',
  'TRAVEL_AND_EVENTS',
  'GAMING',
  'PEOPLE_AND_BLOGS',
  'COMEDY',
  'ENTERTAINMENT',
  'NEWS_AND_POLITICS',
  'HOWTO_AND_STYLE',
  'EDUCATION',
  'SCIENCE_AND_TECHNOLOGY',
  'NONPROFITS_AND_ACTIVISM',
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

/**
 * Label of a category in a language, e.g. MUSIC -> "Music" / "Música". The raw value if the backend sends a new one.
 */
export function categoryLabel(category: VideoCategory, language: Language = 'en'): string {
  return VIDEO_CATEGORIES.includes(category) ? translate(language, `categories.${category}`) : category;
}
