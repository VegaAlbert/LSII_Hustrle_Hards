import { fireEvent, render, screen } from '@testing-library/react';
import NavBar from '../NavBar';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';

const renderNavBar = (user: AuthContextValue['user']) => {
  const auth: AuthContextValue = { user, login: jest.fn(), register: jest.fn(), logout: jest.fn() };
  const onHome = jest.fn();
  const onLogin = jest.fn();
  render(
    <AuthContext.Provider value={auth}>
      <NavBar onHome={onHome} onLogin={onLogin} />
    </AuthContext.Provider>
  );
  return { auth, onHome, onLogin };
};

describe('NavBar', () => {
  it('shows a login button to anonymous visitors', () => {
    const { onLogin } = renderNavBar(null);

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(onLogin).toHaveBeenCalled();
  });

  it('goes home when clicking the brand', () => {
    const { onHome } = renderNavBar(null);

    fireEvent.click(screen.getByRole('button', { name: 'Pro Tube' }));

    expect(onHome).toHaveBeenCalled();
  });

  it('shows the user initial and logs out from the menu', () => {
    const { auth, onHome } = renderNavBar({ id: 1, username: 'alice', email: 'alice@mail.com' });

    const avatar = screen.getByRole('button', { name: 'User menu for alice' });
    expect(avatar).toHaveTextContent('A');
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();

    fireEvent.click(avatar);
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(auth.logout).toHaveBeenCalled();
    expect(onHome).toHaveBeenCalled();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });
});
