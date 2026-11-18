const original = {
  languages: Object.getOwnPropertyDescriptor(window.navigator, 'languages'),
  language: Object.getOwnPropertyDescriptor(window.navigator, 'language'),
};

/**
 * Makes the browser report these preferred languages (navigator.languages and navigator.language).
 */
export function mockBrowserLanguages(languages: string[], language = languages[0] ?? 'en-US'): void {
  Object.defineProperty(window.navigator, 'languages', { configurable: true, get: () => languages });
  Object.defineProperty(window.navigator, 'language', { configurable: true, get: () => language });
}

export function restoreBrowserLanguages(): void {
  delete (window.navigator as { languages?: unknown }).languages;
  delete (window.navigator as { language?: unknown }).language;
  if (original.languages) Object.defineProperty(window.navigator, 'languages', original.languages);
  if (original.language) Object.defineProperty(window.navigator, 'language', original.language);
}
