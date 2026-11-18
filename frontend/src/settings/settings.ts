// User preferences shown in the settings page.
// The theme (ThemeProvider) and the preferences of preferences.ts (text size and playback) are applied and saved on
// this device. Language and privacy are only kept in the page state for now: applying and saving them is still to
// be done.

export type Theme = 'light' | 'dark' | 'system';

export const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];
export type Language = 'en' | 'es' | 'ca';
export type TextSize = 'small' | 'medium' | 'large';

export const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

// Not saved yet (see the note above)
export type PendingSettings = {
  language: Language;
  publicProfile: boolean;
  watchHistory: boolean;
};

export const DEFAULT_PENDING_SETTINGS: PendingSettings = {
  language: 'en',
  publicProfile: true,
  watchHistory: true,
};

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'ca', label: 'Català' },
];

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
