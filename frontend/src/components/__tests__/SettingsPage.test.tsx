import { fireEvent, render, screen } from '@testing-library/react';
import SettingsPage from '../SettingsPage';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { I18nProvider } from '../../i18n/I18nProvider';
import { LANGUAGE_STORAGE_KEY } from '../../i18n/languagePreference';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { THEME_STORAGE_KEY } from '../../theme/themePreference';

const renderSettings = (user: AuthContextValue['user'] = null) => {
  const auth: AuthContextValue = {
    user,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
  };
  render(
    <ThemeProvider>
      <I18nProvider>
        <AuthContext.Provider value={auth}>
          <SettingsPage />
        </AuthContext.Provider>
      </I18nProvider>
    </ThemeProvider>
  );
};

describe('SettingsPage', () => {
  beforeEach(() => localStorage.clear());

  it('shows every settings section and warns that only the theme and language are saved yet', () => {
    renderSettings();

    for (const title of ['Appearance', 'Language', 'Playback', 'Notifications', 'Privacy']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(screen.getByRole('note')).toHaveTextContent('The theme and language are applied and saved on this device');
    expect(screen.getByRole('note')).toHaveTextContent('The other settings are not applied or saved yet');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('hides the account section from anonymous visitors', () => {
    renderSettings();

    expect(screen.queryByRole('heading', { name: 'Account' })).not.toBeInTheDocument();
  });

  it('shows the account section to logged-in users', () => {
    renderSettings({ id: 1, username: 'alice', email: 'alice@mail.com' });

    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByText('alice@mail.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeDisabled();
  });

  it('applies and saves the theme chosen in Appearance', () => {
    renderSettings();
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));

    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('shows the theme saved in a previous visit', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    renderSettings();

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  it('updates the controls and resets them to the defaults', () => {
    renderSettings();

    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Large' }));
    fireEvent.click(screen.getByLabelText('Autoplay'));
    fireEvent.change(screen.getByLabelText('Default quality'), { target: { value: '720p' } });
    fireEvent.change(screen.getByLabelText('Playback speed'), { target: { value: '1.5' } });
    fireEvent.click(screen.getByLabelText('Comments on my videos'));
    fireEvent.click(screen.getByLabelText('New videos'));
    fireEvent.click(screen.getByLabelText('Public profile'));
    fireEvent.click(screen.getByLabelText('Watch history'));

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked();
    expect(screen.getByLabelText('Autoplay')).not.toBeChecked();
    expect(screen.getByLabelText('Default quality')).toHaveValue('720p');
    expect(screen.getByLabelText('Playback speed')).toHaveValue('1.5');
    expect(screen.getByLabelText('New videos')).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(screen.getByLabelText('Autoplay')).toBeChecked();
    expect(screen.getByLabelText('New videos')).not.toBeChecked();
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
