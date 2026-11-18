import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageMenu from '../LanguageMenu';
import ThemeMenu from '../ThemeMenu';
import { I18nProvider } from '../../i18n/I18nProvider';
import { LANGUAGE_STORAGE_KEY } from '../../i18n/languagePreference';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { mockSystemTheme, removeSystemTheme } from '../../test/mockSystemTheme';
import { mockBrowserLanguages, restoreBrowserLanguages } from '../../test/mockBrowserLanguages';

const renderMenus = () =>
  render(
    <ThemeProvider>
      <I18nProvider>
        <LanguageMenu />
        <ThemeMenu />
        <p>Outside</p>
      </I18nProvider>
    </ThemeProvider>
  );

describe('LanguageMenu', () => {
  beforeEach(() => {
    localStorage.clear();
    mockSystemTheme(false);
    mockBrowserLanguages(['en-US']);
  });

  afterEach(() => {
    removeSystemTheme();
    restoreBrowserLanguages();
  });

  it('shows the current language in the name of its button', () => {
    renderMenus();

    expect(screen.getByRole('button', { name: 'Language: English' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'en');
  });

  it('starts in the browser language on the first visit', () => {
    mockBrowserLanguages(['ca-ES']);
    renderMenus();

    expect(screen.getByRole('button', { name: 'Idioma: Català' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tema: Sistema' })).toBeInTheDocument();
  });

  it('switches the whole interface to Spanish and saves the choice', async () => {
    const user = userEvent.setup();
    renderMenus();

    await user.click(screen.getByRole('button', { name: 'Language: English' }));
    const options = screen.getByRole('group', { name: 'Language' });
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(options.querySelectorAll('button[lang]')).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'Español' }));

    expect(screen.queryByRole('group', { name: 'Idioma' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Idioma: Español' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Tema: Sistema' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');
  });

  it('keeps the saved language after a reload', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ca');
    renderMenus();

    expect(screen.getByRole('button', { name: 'Idioma: Català' })).toBeInTheDocument();
  });

  it('closes with Escape and when clicking outside', async () => {
    const user = userEvent.setup();
    renderMenus();
    const button = screen.getByRole('button', { name: 'Language: English' });

    await user.click(button);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument();
    expect(button).toHaveFocus();

    await user.click(button);
    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument();
  });

  it('follows a language changed in another tab', () => {
    renderMenus();

    act(() => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ca');
      window.dispatchEvent(new StorageEvent('storage', { key: LANGUAGE_STORAGE_KEY }));
    });

    expect(screen.getByRole('button', { name: 'Idioma: Català' })).toBeInTheDocument();
  });
});
