// User preferences shown in the settings page.
// The theme is applied and saved on this device (ThemeProvider, dark mode). The rest are only kept in the page state
// for now: applying and saving each one is still to be done.

export type Theme = 'light' | 'dark' | 'system';

export const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];
export type Language = 'en' | 'es' | 'ca';
export type TextSize = 'small' | 'medium' | 'large';
export type VideoQuality = 'auto' | '1080p' | '720p' | '480p';

export type Settings = {
  theme: Theme;
  textSize: TextSize;
  language: Language;
  autoplay: boolean;
  videoQuality: VideoQuality;
  playbackSpeed: number;
  emailOnComment: boolean;
  emailOnNewVideo: boolean;
  publicProfile: boolean;
  watchHistory: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  textSize: 'medium',
  language: 'en',
  autoplay: true,
  videoQuality: 'auto',
  playbackSpeed: 1,
  emailOnComment: true,
  emailOnNewVideo: false,
  publicProfile: true,
  watchHistory: true,
};

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'ca', label: 'Català' },
];

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
