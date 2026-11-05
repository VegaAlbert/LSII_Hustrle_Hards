// Same values as the VideoCategory enum of the backend, with the label shown to users
export const VIDEO_CATEGORIES = [
  { value: 'FILM_AND_ANIMATION', label: 'Film & Animation' },
  { value: 'AUTOS_AND_VEHICLES', label: 'Autos & Vehicles' },
  { value: 'MUSIC', label: 'Music' },
  { value: 'PETS_AND_ANIMALS', label: 'Pets & Animals' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'TRAVEL_AND_EVENTS', label: 'Travel & Events' },
  { value: 'GAMING', label: 'Gaming' },
  { value: 'PEOPLE_AND_BLOGS', label: 'People & Blogs' },
  { value: 'COMEDY', label: 'Comedy' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'NEWS_AND_POLITICS', label: 'News & Politics' },
  { value: 'HOWTO_AND_STYLE', label: 'Howto & Style' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'SCIENCE_AND_TECHNOLOGY', label: 'Science & Technology' },
  { value: 'NONPROFITS_AND_ACTIVISM', label: 'Nonprofits & Activism' },
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number]['value'];

export function categoryLabel(category: VideoCategory): string {
  return VIDEO_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}
