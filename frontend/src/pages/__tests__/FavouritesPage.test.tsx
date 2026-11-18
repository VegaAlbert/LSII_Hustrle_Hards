import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import FavouritesPage from '../FavouritesPage';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { fetchFavourites } from '../../favourites/favouritesApi';
import type { VideoSummary } from '../../videos/videosApi';
import { I18nProvider } from '../../i18n/I18nProvider';

jest.mock('../../favourites/favouritesApi');
const mockedFetchFavourites = fetchFavourites as jest.MockedFunction<typeof fetchFavourites>;

const alice = { id: 1, username: 'alice', email: 'alice@example.com' };

const video = (id: number): VideoSummary => ({
  id,
  title: `Video ${id}`,
  author: 'Author',
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
        value={{ user, login: jest.fn(), register: jest.fn(), loginWithGoogle: jest.fn(), logout: jest.fn() }}
      >
        <MemoryRouter initialEntries={['/favourites']}>
          <Routes>
            <Route path="/favourites" element={<FavouritesPage />} />
            <Route path="/login" element={<LoginStub />} />
            <Route path="/" element={<p>Home page</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </I18nProvider>
  );

describe('FavouritesPage', () => {
  beforeEach(() => {
    mockedFetchFavourites.mockReset();
  });

  it('sends anonymous visitors to log in and back here', () => {
    renderPage(null);

    expect(screen.getByText('Login page, back to /favourites')).toBeInTheDocument();
    expect(mockedFetchFavourites).not.toHaveBeenCalled();
  });

  it('shows the saved videos', async () => {
    mockedFetchFavourites.mockResolvedValueOnce(page([video(1), video(2)], 0, 1));
    renderPage(alice);

    expect(screen.getByRole('heading', { name: 'Favourites' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading favourites...');
    const items = within(await screen.findByRole('list', { name: 'Favourite videos' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Video 1')).toBeInTheDocument();
    expect(mockedFetchFavourites).toHaveBeenCalledWith(0, 12);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows an empty state with a link to browse videos', async () => {
    const user = userEvent.setup();
    mockedFetchFavourites.mockResolvedValueOnce(page([], 0, 0));
    renderPage(alice);

    expect(await screen.findByText('You have no favourite videos yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Favourite videos' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Browse videos' }));
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('loads the next page', async () => {
    const user = userEvent.setup();
    mockedFetchFavourites.mockResolvedValueOnce(page([video(1)], 0, 2)).mockResolvedValueOnce(page([video(2)], 1, 2));
    renderPage(alice);

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Video 2')).toBeInTheDocument();
    expect(screen.getByText('Video 1')).toBeInTheDocument();
    expect(mockedFetchFavourites).toHaveBeenLastCalledWith(1, 12);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows an error that can be retried', async () => {
    const user = userEvent.setup();
    mockedFetchFavourites.mockRejectedValueOnce(new Error('Network error'));
    mockedFetchFavourites.mockResolvedValueOnce(page([video(1)], 0, 1));
    renderPage(alice);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your favourites.');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Video 1')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('shows the page in Catalan', async () => {
    localStorage.setItem('protube.language', 'ca');
    mockedFetchFavourites.mockResolvedValueOnce(page([], 0, 0));

    renderPage(alice);

    expect(await screen.findByText('Encara no tens cap vídeo preferit.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preferits' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explora vídeos' })).toBeInTheDocument();
    localStorage.clear();
  });
});
