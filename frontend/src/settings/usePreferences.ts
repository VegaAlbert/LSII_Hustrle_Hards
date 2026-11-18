import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { applyTextSize, DEFAULT_PREFERENCES, loadPreferences, savePreferences, type Preferences } from './preferences';

/**
 * Preferences of the settings page: every change is applied and saved at once, like the theme.
 */
export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);

  // Before the browser paints, so the page never shows a frame with the old text size
  useLayoutEffect(() => applyTextSize(preferences.textSize), [preferences.textSize]);

  useEffect(() => savePreferences(preferences), [preferences]);

  const update = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
      setPreferences((current) => ({ ...current, [key]: value })),
    []
  );

  const reset = useCallback(() => setPreferences(DEFAULT_PREFERENCES), []);

  return { preferences, update, reset };
}
