import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../SettingsPage';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { I18nProvider } from '../../i18n/I18nProvider';
import { LANGUAGE_STORAGE_KEY } from '../../i18n/languagePreference';
import { PREFERENCES_STORAGE_KEY } from '../../settings/preferences';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { THEME_STORAGE_KEY } from '../../theme/themePreference';

jest.mock('../../account/accountApi', () => ({
  changeUsername: jest.fn(),
  changeEmail: jest.fn(),
  changePassword: jest.fn(),
  deleteAccount: jest.fn(),
}));

const renderSettings = (user: AuthContextValue['user'] = null) => {
  const auth: AuthContextValue = {
    user,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
    updateSession: jest.fn(),
  };
  render(
    <ThemeProvider>
      <I18nProvider>
        <AuthContext.Provider value={auth}>
          <MemoryRouter>
            <SettingsPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </I18nProvider>
    </ThemeProvider>
  );
};

const savedPreferences = () => JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}');

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-text-size');
  });

  it('shows every settings section and says what is saved on this device', () => {
    renderSettings();

    for (const title of ['Appearance', 'Language', 'Playback', 'Privacy']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(screen.getByRole('note')).toHaveTextContent('Theme, language, text size and playback changes apply at once');
    expect(screen.getByRole('note')).toHaveTextContent('Privacy settings are not saved yet');
  });

  it('has no notifications, default quality nor save button', () => {
    renderSettings();

    expect(screen.queryByRole('heading', { name: 'Notifications' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Default quality')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  it('hides the account section from anonymous visitors', () => {
    renderSettings();

    expect(screen.queryByRole('heading', { name: 'Account' })).not.toBeInTheDocument();
  });

  it('shows the account section to logged-in users', () => {
    renderSettings({ id: 1, username: 'alice', email: 'alice@mail.com', hasPassword: true });

    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByText('alice@mail.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change username' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Change email' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Change password' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeEnabled();
  });

  it('applies and saves the theme chosen in Appearance', async () => {
    const user = userEvent.setup();
    renderSettings();
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Light' }));

    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('applies and saves the text size', async () => {
    const user = userEvent.setup();
    renderSettings();
    expect(document.documentElement).toHaveAttribute('data-text-size', 'medium');

    await user.click(screen.getByRole('radio', { name: 'Large' }));

    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-text-size', 'large');
    expect(savedPreferences().textSize).toBe('large');
  });

  it('saves the playback preferences', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByLabelText('Autoplay'));
    await user.selectOptions(screen.getByLabelText('Playback speed'), '1.5');

    expect(screen.getByLabelText('Autoplay')).not.toBeChecked();
    expect(screen.getByLabelText('Playback speed')).toHaveValue('1.5');
    expect(savedPreferences()).toEqual({ textSize: 'medium', autoplay: false, playbackSpeed: 1.5 });
  });

  it('shows the preferences saved in a previous visit', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ textSize: 'small', autoplay: false, playbackSpeed: 2 })
    );

    renderSettings();

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Small' })).toBeChecked();
    expect(screen.getByLabelText('Autoplay')).not.toBeChecked();
    expect(screen.getByLabelText('Playback speed')).toHaveValue('2');
  });

  it('updates the controls and resets them to the defaults', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    await user.click(screen.getByRole('radio', { name: 'Large' }));
    await user.click(screen.getByLabelText('Autoplay'));
    await user.selectOptions(screen.getByLabelText('Playback speed'), '0.5');
    await user.click(screen.getByLabelText('Public profile'));
    await user.click(screen.getByLabelText('Watch history'));

    expect(screen.getByLabelText('Public profile')).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-text-size', 'medium');
    expect(screen.getByLabelText('Autoplay')).toBeChecked();
    expect(screen.getByLabelText('Playback speed')).toHaveValue('1');
    expect(screen.getByLabelText('Public profile')).toBeChecked();
    expect(screen.getByLabelText('Watch history')).toBeChecked();
    expect(savedPreferences()).toEqual({ textSize: 'medium', autoplay: true, playbackSpeed: 1 });
  });

  it('switches the whole page to the language chosen and saves it on this device', () => {
    renderSettings();
    expect(screen.getByLabelText('Interface language')).toHaveValue('en');

    fireEvent.change(screen.getByLabelText('Interface language'), { target: { value: 'ca' } });

    expect(screen.getByRole('heading', { name: 'Configuració' })).toBeInTheDocument();
    expect(screen.getByLabelText('Idioma de la interfície')).toHaveValue('ca');
    expect(screen.getByRole('radio', { name: 'Sistema' })).toBeChecked();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ca');
    expect(document.documentElement).toHaveAttribute('lang', 'ca');
  });

  it('shows the language saved in a previous visit and resets it to English', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'es');

    renderSettings();

    expect(screen.getByRole('heading', { name: 'Apariencia' })).toBeInTheDocument();
    expect(screen.getByLabelText('Idioma de la interfaz')).toHaveValue('es');
    expect(screen.getByRole('option', { name: 'Català' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Restablecer valores predeterminados' }));

    expect(screen.getByLabelText('Interface language')).toHaveValue('en');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });
});
