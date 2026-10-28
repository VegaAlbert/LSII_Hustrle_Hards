import { fireEvent, render, screen } from '@testing-library/react';
import SettingsPage from '../SettingsPage';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';

const renderSettings = (user: AuthContextValue['user'] = null) => {
  const auth: AuthContextValue = { user, login: jest.fn(), register: jest.fn(), logout: jest.fn() };
  render(
    <AuthContext.Provider value={auth}>
      <SettingsPage />
    </AuthContext.Provider>
  );
};

describe('SettingsPage', () => {
  it('shows every settings section and warns that nothing is saved yet', () => {
    renderSettings();

    for (const title of ['Appearance', 'Language', 'Playback', 'Notifications', 'Privacy']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(screen.getByRole('note')).toHaveTextContent('not applied or saved yet');
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
    expect(screen.getByLabelText('Interface language')).toHaveValue('en');
    expect(screen.getByLabelText('Autoplay')).toBeChecked();
    expect(screen.getByLabelText('New videos')).not.toBeChecked();
  });
});
