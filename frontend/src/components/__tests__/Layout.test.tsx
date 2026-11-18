import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Layout from '../Layout';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { ThemeProvider } from '../../theme/ThemeProvider';

const PAGES = ['login', 'settings', 'upload', 'analytics', 'favourites', 'subscriptions'];

const renderLayout = (user: AuthContextValue['user'], path = '/') => {
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
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<p>Home page</p>} />
              {PAGES.map((page) => (
                <Route key={page} path={page} element={<p>{`${page} page`}</p>} />
              ))}
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

const alice = { username: 'alice', email: 'alice@protube.test' };

describe('Layout', () => {
  beforeEach(() => localStorage.clear());

  it('renders the navbar and the current page', () => {
    renderLayout(null);

    expect(screen.getByRole('button', { name: 'ProTube' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Home page');
  });

  it('opens the login, settings and upload pages from the navbar', async () => {
    const user = userEvent.setup();
    renderLayout(null);

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByText('login page')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByText('settings page')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Create/ }));
    expect(screen.getByText('upload page')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ProTube' }));
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('hides the login button on the login page', () => {
    renderLayout(null, '/login');

    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Log in' })).not.toBeInTheDocument();
  });

  it.each([
    ['Favourites', 'favourites page'],
    ['Subscriptions', 'subscriptions page'],
    ['Analytics', 'analytics page'],
  ])('opens the %s page from the user menu', async (item, page) => {
    const user = userEvent.setup();
    renderLayout(alice);

    await user.click(screen.getByRole('button', { name: 'User menu for alice' }));
    await user.click(screen.getByRole('button', { name: item }));

    expect(screen.getByText(page)).toBeInTheDocument();
  });
});
