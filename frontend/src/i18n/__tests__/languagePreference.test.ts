import axios from 'axios';
import {
  applyLanguage,
  detectBrowserLanguage,
  LANGUAGE_STORAGE_KEY,
  loadLanguagePreference,
  saveLanguagePreference,
} from '../languagePreference';
import { mockBrowserLanguages, restoreBrowserLanguages } from '../../test/mockBrowserLanguages';

describe('languagePreference', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    restoreBrowserLanguages();
    jest.restoreAllMocks();
  });

  it('uses the first browser language ProTube speaks', () => {
    mockBrowserLanguages(['fr-FR', 'ca-ES', 'es']);

    expect(detectBrowserLanguage()).toBe('ca');
  });

  it('uses English when the browser speaks no supported language', () => {
    mockBrowserLanguages(['fr-FR', 'de']);

    expect(detectBrowserLanguage()).toBe('en');
  });

  it('uses navigator.language when the browser gives no list', () => {
    mockBrowserLanguages([], 'es-ES');

    expect(detectBrowserLanguage()).toBe('es');
  });

  it('loads the saved language before the browser one', () => {
    mockBrowserLanguages(['es-ES']);
    saveLanguagePreference('ca');

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ca');
    expect(loadLanguagePreference()).toBe('ca');
  });

  it('ignores an unknown saved value', () => {
    mockBrowserLanguages(['es-ES']);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'klingon');

    expect(loadLanguagePreference()).toBe('es');
  });

  it('falls back to the browser language when storage is blocked', () => {
    mockBrowserLanguages(['ca']);
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(loadLanguagePreference()).toBe('ca');
    expect(() => saveLanguagePreference('es')).not.toThrow();
  });

  it('marks the page and the API requests with the language', () => {
    applyLanguage('es');

    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(axios.defaults.headers.common['Accept-Language']).toBe('es');
  });
});
