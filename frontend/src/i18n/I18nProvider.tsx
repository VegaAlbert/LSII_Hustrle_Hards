import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import type { Language } from '../settings/settings';
import { createI18nValue, I18nContext } from './i18nContext';
import {
  applyLanguage,
  loadLanguagePreference,
  LANGUAGE_STORAGE_KEY,
  saveLanguagePreference,
} from './languagePreference';

/**
 * Internationalization: keeps the language chosen by the user (English, Spanish or Catalan), saves it on this device
 * and shows the whole UI in it. On the first visit it uses the browser language. Read it with useTranslation().
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(loadLanguagePreference);

  // Before the browser paints and before any request of the children is sent
  useLayoutEffect(() => applyLanguage(language), [language]);

  // Keep other open tabs of ProTube in sync when the language is changed in one of them
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY) setLanguageState(loadLanguagePreference());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    saveLanguagePreference(next);
  }, []);

  const value = useMemo(() => createI18nValue(language, setLanguage), [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
