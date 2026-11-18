import {
  applyTheme,
  loadThemePreference,
  resolveTheme,
  saveThemePreference,
  systemPrefersDark,
  THEME_STORAGE_KEY,
} from '../themePreference';
import { mockSystemTheme, removeSystemTheme } from '../../test/mockSystemTheme';

describe('themePreference', () => {
  beforeEach(() => {
    localStorage.clear();
    removeSystemTheme();
  });

  it('uses System on the first visit', () => {
    expect(loadThemePreference()).toBe('system');
  });

  it('saves and loads the chosen theme', () => {
    saveThemePreference('light');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(loadThemePreference()).toBe('light');
  });

  it('ignores an unknown saved value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');

    expect(loadThemePreference()).toBe('system');
  });

  it('falls back to System when the storage is blocked', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(loadThemePreference()).toBe('system');
    expect(() => saveThemePreference('dark')).not.toThrow();

    getItem.mockRestore();
    setItem.mockRestore();
  });

  it('reads the system appearance, dark when the browser cannot tell', () => {
    expect(systemPrefersDark()).toBe(true);

    mockSystemTheme(false);
    expect(systemPrefersDark()).toBe(false);

    mockSystemTheme(true);
    expect(systemPrefersDark()).toBe(true);
  });

  it('resolves System with the system appearance and keeps Light and Dark as they are', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('draws the page with the theme', () => {
    applyTheme('light');

    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
});
