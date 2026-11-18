import axios from 'axios';
import { LANGUAGES, type Language } from '../settings/settings';

// Kept in localStorage, like the theme. The inline script of index.html reads the same key
export const LANGUAGE_STORAGE_KEY = 'protube.language';

export const DEFAULT_LANGUAGE: Language = 'en';

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language.value === value);
}

/**
 * First language of the browser that ProTube speaks ("ca-ES" -> "ca"), or English.
 */
export function detectBrowserLanguage(): Language {
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of preferred) {
    const base = tag?.toLowerCase().split('-')[0];
    if (isLanguage(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Saved language, or the browser's on the first visit, with an unknown value or when storage is blocked.
 */
export function loadLanguagePreference(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(saved) ? saved : detectBrowserLanguage();
  } catch {
    return detectBrowserLanguage();
  }
}

export function saveLanguagePreference(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage blocked (e.g. private mode): the language still applies until the page is closed
  }
}

/**
 * Tells the browser (screen readers, hyphenation, spell check) and the backend (error messages) which language the
 * page is in.
 */
export function applyLanguage(language: Language): void {
  document.documentElement.lang = language;
  axios.defaults.headers.common['Accept-Language'] = language;
}
