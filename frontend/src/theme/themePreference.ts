import type { Theme } from '../settings/settings';

/**
 * Theme the page is drawn with: the "system" preference resolves to one of these.
 */
export type ResolvedTheme = 'light' | 'dark';

// Kept in localStorage, like the session, so it survives reloads. The inline script of index.html reads the same key
export const THEME_STORAGE_KEY = 'protube.theme';
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

const THEMES: readonly Theme[] = ['light', 'dark', 'system'];

/**
 * Saved preference, or "system" on the first visit, with an unknown value or when storage is blocked.
 */
export function loadThemePreference(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.includes(saved as Theme) ? (saved as Theme) : 'system';
  } catch {
    return 'system';
  }
}

export function saveThemePreference(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked (e.g. private mode): the theme still applies until the page is closed
  }
}

/**
 * Whether the operating system asks for a dark appearance. Dark, the ProTube default, when the browser cannot tell.
 */
export function systemPrefersDark(): boolean {
  return window.matchMedia?.(DARK_SCHEME_QUERY).matches ?? true;
}

export function resolveTheme(theme: Theme, systemDark: boolean): ResolvedTheme {
  if (theme === 'system') {
    return systemDark ? 'dark' : 'light';
  }
  return theme;
}

/**
 * Draws the page with a theme: Bootstrap and the --pt-* tokens of theme.css switch on `data-bs-theme`, and
 * `color-scheme` makes the browser draw scrollbars and native controls to match.
 */
export function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;
  root.setAttribute('data-bs-theme', theme);
  root.style.colorScheme = theme;
}
