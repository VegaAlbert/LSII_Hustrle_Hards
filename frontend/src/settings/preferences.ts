import { PLAYBACK_SPEEDS, TEXT_SIZES, type TextSize } from './settings';

/**
 * Preferences of the settings page that are applied and saved on this device, like the theme.
 */
export type Preferences = {
  // Size of every text of the app: theme.css scales the root font size with `data-text-size`
  textSize: TextSize;
  // Whether the video player starts playing as soon as a video opens
  autoplay: boolean;
  // Speed the video player starts at (1 = normal)
  playbackSpeed: number;
};

export const DEFAULT_PREFERENCES: Preferences = {
  textSize: 'medium',
  autoplay: true,
  playbackSpeed: 1,
};

// Kept in localStorage like the theme. The inline script of index.html reads the same key for the text size
export const PREFERENCES_STORAGE_KEY = 'protube.preferences';

const isTextSize = (value: unknown): value is TextSize => TEXT_SIZES.some((size) => size.value === value);
const isSpeed = (value: unknown): value is number => PLAYBACK_SPEEDS.includes(value as number);

/**
 * Saved preferences. Missing, unknown or broken values (or blocked storage) fall back to the defaults one by one.
 */
export function loadPreferences(): Preferences {
  let saved: Partial<Record<keyof Preferences, unknown>> = {};
  try {
    saved = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}') ?? {};
  } catch {
    // Broken JSON or storage blocked: defaults
  }
  return {
    textSize: isTextSize(saved.textSize) ? saved.textSize : DEFAULT_PREFERENCES.textSize,
    autoplay: typeof saved.autoplay === 'boolean' ? saved.autoplay : DEFAULT_PREFERENCES.autoplay,
    playbackSpeed: isSpeed(saved.playbackSpeed) ? saved.playbackSpeed : DEFAULT_PREFERENCES.playbackSpeed,
  };
}

export function savePreferences(preferences: Preferences): void {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage blocked (e.g. private mode): the preferences still apply until the page is closed
  }
}

/**
 * Scales every text of the app: theme.css changes the root font size and all sizes are in rem.
 */
export function applyTextSize(textSize: TextSize): void {
  document.documentElement.setAttribute('data-text-size', textSize);
}
