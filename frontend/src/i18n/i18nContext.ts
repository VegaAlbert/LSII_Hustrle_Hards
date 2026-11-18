import { createContext, useContext } from 'react';
import type { Language } from '../settings/settings';
import { DEFAULT_LANGUAGE } from './languagePreference';
import { translate, type TranslateFn } from './translate';

export type I18nContextValue = {
  // Language the UI is shown in
  language: Language;
  setLanguage: (language: Language) => void;
  // Text of a key in the current language, e.g. t('nav.login') or t('video.views', { count: 3 })
  t: TranslateFn;
};

export function createI18nValue(language: Language, setLanguage: (language: Language) => void): I18nContextValue {
  return { language, setLanguage, t: (key, params) => translate(language, key, params) };
}

// English when there is no <I18nProvider> (e.g. a component rendered alone in a unit test)
export const I18nContext = createContext<I18nContextValue>(createI18nValue(DEFAULT_LANGUAGE, () => {}));

export function useTranslation(): I18nContextValue {
  return useContext(I18nContext);
}
