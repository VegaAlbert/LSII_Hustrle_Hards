import { fireEvent, render, screen } from '@testing-library/react';
import NavBar from '../NavBar';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';

const renderNavBar = (user: AuthContextValue['user'], showLogin?: boolean) => {
  const auth: AuthContextValue = { user, login: jest.fn(), register: jest.fn(), logout: jest.fn() };
  const onHome = jest.fn();
  const onLogin = jest.fn();
  const onSettings = jest.fn();
  render(
    <AuthContext.Provider value={auth}>
      <NavBar onHome={onHome} onLogin={onLogin} onSettings={onSettings} showLogin={showLogin} />
    </AuthContext.Provider>
  );
  return { auth, onHome, onLogin, onSettings };
};

describe('NavBar', () => {
  it('shows a login button to anonymous visitors', () => {
    const { onLogin } = renderNavBar(null);

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(onLogin).toHaveBeenCalled();
  });

  it('hides the login button while the login page is open', () => {
    renderNavBar(null, false);

    expect(screen.queryByRole('button', { name: 'Log in' })).not.toBeInTheDocument();
  });

  it('opens the settings page from the gear button', () => {
    const { onSettings } = renderNavBar(null);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(onSettings).toHaveBeenCalled();
  });

  it('goes home when clicking the brand', () => {
    const { onHome } = renderNavBar(null);

    fireEvent.click(screen.getByRole('button', { name: 'ProTube' }));

    expect(onHome).toHaveBeenCalled();
  });

  it('shows the user initial and logs out from the menu', () => {
    const { auth, onHome } = renderNavBar({ id: 1, username: 'alice', email: 'alice@mail.com' });

    const avatar = screen.getByRole('button', { name: 'User menu for alice' });
    expect(avatar).toHaveTextContent('A');
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();

    fireEvent.click(avatar);
    expect(screen.getByText('alice@mail.com')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(auth.logout).toHaveBeenCalled();
    expect(onHome).toHaveBeenCalled();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });
});
