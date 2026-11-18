import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import SubscriptionsPage from '../SubscriptionsPage';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { fetchSubscriptionVideos } from '../../subscriptions/subscriptionsApi';
import type { VideoSummary } from '../../videos/videosApi';

jest.mock('../../subscriptions/subscriptionsApi');
const mockedFetchVideos = fetchSubscriptionVideos as jest.MockedFunction<typeof fetchSubscriptionVideos>;

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
    <AuthContext.Provider
      value={{ user, login: jest.fn(), register: jest.fn(), loginWithGoogle: jest.fn(), logout: jest.fn() }}
    >
      <MemoryRouter initialEntries={['/subscriptions']}>
        <Routes>
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/login" element={<LoginStub />} />
          <Route path="/" element={<p>Home page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('SubscriptionsPage', () => {
  beforeEach(() => {
    mockedFetchVideos.mockReset();
  });

  it('sends anonymous visitors to log in and back here', () => {
    renderPage(null);

    expect(screen.getByText('Login page, back to /subscriptions')).toBeInTheDocument();
    expect(mockedFetchVideos).not.toHaveBeenCalled();
  });

  it('shows the videos of the subscribed channels', async () => {
    mockedFetchVideos.mockResolvedValueOnce(page([video(1), video(2)], 0, 1));
    renderPage(alice);

    expect(screen.getByRole('heading', { name: 'Subscriptions' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading subscriptions...');
    const list = await screen.findByRole('list', { name: 'Videos from your subscriptions' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Video 1')).toBeInTheDocument();
    expect(mockedFetchVideos).toHaveBeenCalledWith(0, 12);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows an empty state with a link to browse videos', async () => {
    const user = userEvent.setup();
    mockedFetchVideos.mockResolvedValueOnce(page([], 0, 0));
    renderPage(alice);

    expect(await screen.findByText('There are no videos from your subscriptions yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Videos from your subscriptions' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Browse videos' }));
    expect(screen.getByText('Home page')).toBeInTheDocument();
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
});
