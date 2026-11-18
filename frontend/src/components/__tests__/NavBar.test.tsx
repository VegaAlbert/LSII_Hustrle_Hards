import { fireEvent, render, screen } from '@testing-library/react';
import NavBar from '../NavBar';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { ThemeProvider } from '../../theme/ThemeProvider';

const renderNavBar = (user: AuthContextValue['user'], showLogin?: boolean) => {
  const auth: AuthContextValue = {
    user,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
    updateSession: jest.fn(),
  };
  const onHome = jest.fn();
  const onLogin = jest.fn();
  const onSettings = jest.fn();
  const onUpload = jest.fn();
  const onFavourites = jest.fn();
  render(
    <ThemeProvider>
      <AuthContext.Provider value={auth}>
        <NavBar
          onHome={onHome}
          onLogin={onLogin}
          onSettings={onSettings}
          onUpload={onUpload}
          onFavourites={onFavourites}
          showLogin={showLogin}
        />
      </AuthContext.Provider>
    </ThemeProvider>
  );
  return { auth, onHome, onLogin, onSettings, onUpload, onFavourites };
};

describe('NavBar', () => {
  beforeEach(() => localStorage.clear());

  it('has the dark mode switch next to the settings button', () => {
    renderNavBar(null);

    expect(screen.getByRole('button', { name: 'Theme: System' })).toBeInTheDocument();
  });

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

  it('opens the upload page from the Create button', () => {
    const { onUpload } = renderNavBar(null);

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(onUpload).toHaveBeenCalled();
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

  it('opens the analytics page from the user menu', () => {
    const auth: AuthContextValue = {
      user: { id: 1, username: 'alice', email: 'alice@mail.com' },
      login: jest.fn(),
      register: jest.fn(),
      loginWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateSession: jest.fn(),
    };
    const onAnalytics = jest.fn();
    render(
      <ThemeProvider>
        <AuthContext.Provider value={auth}>
          <NavBar
            onHome={jest.fn()}
            onLogin={jest.fn()}
            onSettings={jest.fn()}
            onUpload={jest.fn()}
            onAnalytics={onAnalytics}
          />
        </AuthContext.Provider>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'User menu for alice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Analytics' }));

    expect(onAnalytics).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Analytics' })).not.toBeInTheDocument();
  });

  it('does not offer analytics to anonymous visitors', () => {
    renderNavBar(null);

    expect(screen.queryByRole('button', { name: 'Analytics' })).not.toBeInTheDocument();
  });

  it('opens the favourites from the user menu', () => {
    const { onFavourites } = renderNavBar({ id: 1, username: 'alice', email: 'alice@mail.com' });

    fireEvent.click(screen.getByRole('button', { name: 'User menu for alice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Favourites' }));

    expect(onFavourites).toHaveBeenCalled();
    // The menu closes after choosing an option
    expect(screen.queryByRole('button', { name: 'Favourites' })).not.toBeInTheDocument();
  });

  it('opens the subscriptions from the user menu', () => {
    const auth: AuthContextValue = {
      user: { id: 1, username: 'alice', email: 'alice@mail.com' },
      login: jest.fn(),
      register: jest.fn(),
      loginWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateSession: jest.fn(),
    };
    const onSubscriptions = jest.fn();
    render(
      <ThemeProvider>
        <AuthContext.Provider value={auth}>
          <NavBar
            onHome={jest.fn()}
            onLogin={jest.fn()}
            onSettings={jest.fn()}
            onUpload={jest.fn()}
            onSubscriptions={onSubscriptions}
          />
        </AuthContext.Provider>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'User menu for alice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Subscriptions' }));

    expect(onSubscriptions).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Subscriptions' })).not.toBeInTheDocument();
  });
});
