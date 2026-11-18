import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AxiosError, type AxiosResponse } from 'axios';
import SubscribeButton from '../SubscribeButton';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { fetchSubscription, setSubscription } from '../../subscriptions/subscriptionsApi';
import { I18nProvider } from '../../i18n/I18nProvider';

jest.mock('../../subscriptions/subscriptionsApi', () => ({
  ...jest.requireActual('../../subscriptions/subscriptionsApi'),
  fetchSubscription: jest.fn(),
  setSubscription: jest.fn(),
}));
const mockedFetchSubscription = fetchSubscription as jest.MockedFunction<typeof fetchSubscription>;
const mockedSetSubscription = setSubscription as jest.MockedFunction<typeof setSubscription>;

const alice = { id: 1, username: 'alice', email: 'alice@example.com' };

// Shows where the login redirect sends the user back to
const LoginStub = () => {
  const from = (useLocation().state as { from?: string } | null)?.from;
  return <p>Login page, back to {from}</p>;
};

const httpError = (status: number) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: {},
  } as AxiosResponse);

const renderButton = (user: AuthContextValue['user'], channel = 'bob') =>
  render(
    <I18nProvider>
      <AuthContext.Provider
        value={{ user, login: jest.fn(), register: jest.fn(), loginWithGoogle: jest.fn(), logout: jest.fn() }}
      >
        <MemoryRouter initialEntries={['/videos/5?t=30']}>
          <Routes>
            <Route path="/videos/:id" element={<SubscribeButton channel={channel} />} />
            <Route path="/login" element={<LoginStub />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </I18nProvider>
  );

// The button once the state has been read (it is disabled until then)
const readyButton = async (name: string) => {
  const button = await screen.findByRole('button', { name });
  await waitFor(() => expect(button).toBeEnabled());
  return button;
};

describe('SubscribeButton', () => {
  beforeEach(() => {
    mockedFetchSubscription.mockReset();
    mockedSetSubscription.mockReset();
  });

  it('shows the subscribers of a channel the user does not follow yet', async () => {
    mockedFetchSubscription.mockResolvedValueOnce({ channel: 'bob', subscribed: false, subscribers: 2 });
    renderButton(alice);

    const button = screen.getByRole('button', { name: 'Subscribe' });
    // Disabled until the state is known
    expect(button).toBeDisabled();
    expect(await screen.findByText('2 subscribers')).toBeInTheDocument();
    await waitFor(() => expect(button).toBeEnabled());
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(mockedFetchSubscription).toHaveBeenCalledWith('bob');
  });

  it('shows a followed channel as pressed', async () => {
    mockedFetchSubscription.mockResolvedValueOnce({ channel: 'bob', subscribed: true, subscribers: 1 });
    renderButton(alice);

    expect(await readyButton('Subscribed')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 subscriber')).toBeInTheDocument();
  });

  it('subscribes and updates the number of subscribers', async () => {
    const user = userEvent.setup();
    mockedFetchSubscription.mockResolvedValueOnce({ channel: 'bob', subscribed: false, subscribers: 0 });
    mockedSetSubscription.mockResolvedValueOnce({ channel: 'bob', subscribed: true, subscribers: 1 });
    renderButton(alice);

    await user.click(await readyButton('Subscribe'));

    expect(mockedSetSubscription).toHaveBeenCalledWith('bob', true);
    expect(await screen.findByRole('button', { name: 'Subscribed' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 subscriber')).toBeInTheDocument();
  });

  it('unsubscribes from a followed channel', async () => {
    const user = userEvent.setup();
    mockedFetchSubscription.mockResolvedValueOnce({ channel: 'bob', subscribed: true, subscribers: 1 });
    mockedSetSubscription.mockResolvedValueOnce({ channel: 'bob', subscribed: false, subscribers: 0 });
    renderButton(alice);

    await user.click(await readyButton('Subscribed'));

    expect(mockedSetSubscription).toHaveBeenCalledWith('bob', false);
    expect(await screen.findByRole('button', { name: 'Subscribe' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('0 subscribers')).toBeInTheDocument();
  });

  it('only shows the subscribers on the own channel of the user', async () => {
    mockedFetchSubscription.mockResolvedValueOnce({ channel: 'alice', subscribed: false, subscribers: 4 });
    renderButton(alice, 'alice');

    expect(await screen.findByText('4 subscribers')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('starts as not subscribed when the state cannot be read', async () => {
    mockedFetchSubscription.mockRejectedValueOnce(httpError(500));
    renderButton(alice);

    await readyButton('Subscribe');
    expect(screen.queryByText(/subscriber/)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error when subscribing fails', async () => {
    const user = userEvent.setup();
    mockedFetchSubscription.mockResolvedValueOnce({ channel: 'bob', subscribed: false, subscribers: 0 });
    mockedSetSubscription.mockRejectedValueOnce(httpError(500));
    renderButton(alice);

    await user.click(await readyButton('Subscribe'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not update your subscription.');
    expect(screen.getByRole('button', { name: 'Subscribe' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('asks to log in again when the session expired', async () => {
    const user = userEvent.setup();
    mockedFetchSubscription.mockResolvedValueOnce({ channel: 'bob', subscribed: false, subscribers: 0 });
    mockedSetSubscription.mockRejectedValueOnce(httpError(401));
    renderButton(alice);

    await user.click(await readyButton('Subscribe'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your session has expired. Log in again to subscribe.');
  });

  it('shows the subscribers to anonymous visitors and sends them to log in', async () => {
    const user = userEvent.setup();
    mockedFetchSubscription.mockResolvedValueOnce({ channel: 'bob', subscribed: false, subscribers: 3 });
    renderButton(null);

    expect(await screen.findByText('3 subscribers')).toBeInTheDocument();
    await user.click(await readyButton('Subscribe'));

    expect(screen.getByText('Login page, back to /videos/5?t=30')).toBeInTheDocument();
    expect(mockedSetSubscription).not.toHaveBeenCalled();
  });

  it('shows the subscribers and the button in Spanish', async () => {
    localStorage.setItem('protube.language', 'es');
    mockedFetchSubscription.mockResolvedValueOnce({ channel: 'bob', subscribed: false, subscribers: 1 });

    renderButton(alice);

    expect(await readyButton('Suscribirse')).toBeInTheDocument();
    expect(screen.getByText('1 suscriptor')).toBeInTheDocument();
    localStorage.clear();
  });
});
