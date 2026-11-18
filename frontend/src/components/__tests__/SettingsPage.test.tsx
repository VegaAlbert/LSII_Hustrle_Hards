import { fireEvent, render, screen } from '@testing-library/react';
import SettingsPage from '../SettingsPage';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
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
      <AuthContext.Provider value={auth}>
        <SettingsPage />
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

describe('SettingsPage', () => {
  beforeEach(() => localStorage.clear());

  it('shows every settings section and warns that only the theme is saved yet', () => {
    renderSettings();

    for (const title of ['Appearance', 'Language', 'Playback', 'Notifications', 'Privacy']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(screen.getByRole('note')).toHaveTextContent('The theme is applied and saved on this device');
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
    fireEvent.change(screen.getByLabelText('Interface language'), { target: { value: 'es' } });
    fireEvent.click(screen.getByLabelText('Autoplay'));
    fireEvent.change(screen.getByLabelText('Default quality'), { target: { value: '720p' } });
    fireEvent.change(screen.getByLabelText('Playback speed'), { target: { value: '1.5' } });
    fireEvent.click(screen.getByLabelText('Comments on my videos'));
    fireEvent.click(screen.getByLabelText('New videos'));
    fireEvent.click(screen.getByLabelText('Public profile'));
    fireEvent.click(screen.getByLabelText('Watch history'));

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked();
    expect(screen.getByLabelText('Interface language')).toHaveValue('es');
    expect(screen.getByLabelText('Autoplay')).not.toBeChecked();
    expect(screen.getByLabelText('Default quality')).toHaveValue('720p');
    expect(screen.getByLabelText('Playback speed')).toHaveValue('1.5');
    expect(screen.getByLabelText('New videos')).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(screen.getByLabelText('Interface language')).toHaveValue('en');
    expect(screen.getByLabelText('Autoplay')).toBeChecked();
    expect(screen.getByLabelText('New videos')).not.toBeChecked();
  });
});
