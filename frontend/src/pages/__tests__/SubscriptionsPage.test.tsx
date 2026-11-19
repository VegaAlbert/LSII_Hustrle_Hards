import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import SubscriptionsPage from '../SubscriptionsPage';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import {
  fetchSubscribedChannels,
  fetchSubscription,
  fetchSubscriptionVideos,
  setSubscription,
} from '../../subscriptions/subscriptionsApi';
import type { VideoSummary } from '../../videos/videosApi';
import { I18nProvider } from '../../i18n/I18nProvider';

jest.mock('../../subscriptions/subscriptionsApi');
const mockedFetchVideos = fetchSubscriptionVideos as jest.MockedFunction<typeof fetchSubscriptionVideos>;
const mockedFetchChannels = fetchSubscribedChannels as jest.MockedFunction<typeof fetchSubscribedChannels>;
const mockedFetchSubscription = fetchSubscription as jest.MockedFunction<typeof fetchSubscription>;
const mockedSetSubscription = setSubscription as jest.MockedFunction<typeof setSubscription>;

const alice = { id: 1, username: 'alice', email: 'alice@example.com' };

const video = (id: number): VideoSummary => ({
  id,
  title: `Video ${id}`,
  author: 'bob',
  durationSeconds: 60,
  publishedAt: '2024-01-01T00:00:00Z',
  thumbnailUrl: `/media/${id}.webp`,
  videoUrl: `/media/${id}.mp4`,
  ageRestricted: false,
});

const page = (videos: VideoSummary[], pageNumber: number, totalPages: number) => ({
  content: videos,
  page: pageNumber,
  size: 12,
  totalElements: videos.length,
  totalPages,
});

// Shows where the login redirect sends the user back to
const LoginStub = () => {
  const from = (useLocation().state as { from?: string } | null)?.from;
  return <p>Login page, back to {from}</p>;
};

const renderPage = (user: AuthContextValue['user']) =>
  render(
    <I18nProvider>
      <AuthContext.Provider
        value={{
          user,
          login: jest.fn(),
          register: jest.fn(),
          loginWithGoogle: jest.fn(),
          logout: jest.fn(),
          updateSession: jest.fn(),
        }}
      >
        <MemoryRouter initialEntries={['/subscriptions']}>
          <Routes>
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/login" element={<LoginStub />} />
            <Route path="/" element={<p>Home page</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </I18nProvider>
  );

describe('SubscriptionsPage', () => {
  beforeEach(() => {
    mockedFetchVideos.mockReset();
    mockedFetchChannels.mockReset();
    mockedFetchSubscription.mockReset();
    mockedSetSubscription.mockReset();
    mockedFetchChannels.mockResolvedValue([]);
    mockedFetchSubscription.mockImplementation(async (channel) => ({ channel, subscribed: true, subscribers: 1 }));
  });

  it('sends anonymous visitors to log in and back here', () => {
    renderPage(null);

    expect(screen.getByText('Login page, back to /subscriptions')).toBeInTheDocument();
    expect(mockedFetchVideos).not.toHaveBeenCalled();
    expect(mockedFetchChannels).not.toHaveBeenCalled();
  });

  it('lists the subscribed channels, not their videos', async () => {
    mockedFetchChannels.mockResolvedValueOnce([
      { channel: 'bob', subscribed: true, subscribers: 1 },
      { channel: 'AC/DC', subscribed: true, subscribers: 3 },
    ]);
    mockedFetchVideos.mockResolvedValueOnce(page([video(1)], 0, 1));
    renderPage(alice);

    const list = await screen.findByRole('list', { name: 'Channels you are subscribed to' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('bob')).toBeInTheDocument();
    expect(within(items[1]).getByText('AC/DC')).toBeInTheDocument();
    expect(await within(items[0]).findByRole('button', { name: 'Subscribed' })).toBeInTheDocument();
    expect(within(list).queryByText('Video 1')).not.toBeInTheDocument();
  });

  it('unsubscribes from a channel of the list', async () => {
    const user = userEvent.setup();
    mockedFetchChannels.mockResolvedValueOnce([{ channel: 'bob', subscribed: true, subscribers: 1 }]);
    mockedFetchVideos.mockResolvedValueOnce(page([], 0, 0));
    mockedSetSubscription.mockResolvedValueOnce({ channel: 'bob', subscribed: false, subscribers: 0 });
    renderPage(alice);

    await user.click(await screen.findByRole('button', { name: 'Subscribed' }));

    expect(mockedSetSubscription).toHaveBeenCalledWith('bob', false);
    expect(await screen.findByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('shows an empty state when no channel is followed', async () => {
    const user = userEvent.setup();
    mockedFetchVideos.mockResolvedValueOnce(page([], 0, 0));
    renderPage(alice);

    expect(await screen.findByText('You are not subscribed to any channel yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Browse videos' }));
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('shows a channels error that can be retried', async () => {
    const user = userEvent.setup();
    mockedFetchChannels.mockReset();
    mockedFetchChannels
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([{ channel: 'bob', subscribed: true, subscribers: 1 }]);
    mockedFetchVideos.mockResolvedValueOnce(page([], 0, 0));
    renderPage(alice);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your channels.');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('bob')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the videos of the subscribed channels', async () => {
    mockedFetchVideos.mockResolvedValueOnce(page([video(1), video(2)], 0, 1));
    renderPage(alice);

    expect(screen.getByRole('heading', { name: 'Subscriptions' })).toBeInTheDocument();
    expect(screen.getByText('Loading subscriptions...')).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Videos from your subscriptions' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Video 1')).toBeInTheDocument();
    expect(mockedFetchVideos).toHaveBeenCalledWith(0, 12);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('says when the subscribed channels have no videos', async () => {
    mockedFetchVideos.mockResolvedValueOnce(page([], 0, 0));
    renderPage(alice);

    expect(await screen.findByText('There are no videos from your subscriptions yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Videos from your subscriptions' })).not.toBeInTheDocument();
  });

  it('loads the next page', async () => {
    const user = userEvent.setup();
    mockedFetchVideos.mockResolvedValueOnce(page([video(1)], 0, 2)).mockResolvedValueOnce(page([video(2)], 1, 2));
    renderPage(alice);

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Video 2')).toBeInTheDocument();
    expect(screen.getByText('Video 1')).toBeInTheDocument();
    expect(mockedFetchVideos).toHaveBeenLastCalledWith(1, 12);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows an error that can be retried', async () => {
    const user = userEvent.setup();
    mockedFetchVideos.mockRejectedValueOnce(new Error('Network error'));
    mockedFetchVideos.mockResolvedValueOnce(page([video(1)], 0, 1));
    renderPage(alice);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your subscriptions.');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Video 1')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('shows the page in Spanish', async () => {
    localStorage.setItem('protube.language', 'es');
    mockedFetchVideos.mockResolvedValueOnce(page([], 0, 0));

    renderPage(alice);

    expect(await screen.findByText('Todavía no hay vídeos de tus suscripciones.')).toBeInTheDocument();
    expect(await screen.findByText('Todavía no estás suscrito a ningún canal.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Suscripciones' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Canales' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar vídeos' })).toBeInTheDocument();
    localStorage.clear();
  });
});
