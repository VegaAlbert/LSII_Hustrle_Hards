import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import type { Theme } from '../settings/settings';
import { ThemeContext, type ThemeContextValue } from './themeContext';
import {
  applyTheme,
  DARK_SCHEME_QUERY,
  loadThemePreference,
  resolveTheme,
  saveThemePreference,
  systemPrefersDark,
  THEME_STORAGE_KEY,
} from './themePreference';

/**
 * Dark mode: keeps the theme chosen by the user (light, dark or system), saves it on this device and draws the whole
 * app with it. With "system" it follows the operating system, also when it changes while the app is open. Read it
 * with useTheme().
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<Theme>(loadThemePreference);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const theme = resolveTheme(preference, systemDark);

  // Before the browser paints, so changing the theme never shows a frame with the old one
  useLayoutEffect(() => applyTheme(theme), [theme]);

  // Follow the operating system when the user switches it between light and dark
  useEffect(() => {
    const query = window.matchMedia?.(DARK_SCHEME_QUERY);
    if (!query) return;
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // Keep other open tabs of ProTube in sync when the theme is changed in one of them
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) setPreferenceState(loadThemePreference());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPreference = useCallback((next: Theme) => {
    setPreferenceState(next);
    saveThemePreference(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, theme, setPreference }),
    [preference, theme, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
