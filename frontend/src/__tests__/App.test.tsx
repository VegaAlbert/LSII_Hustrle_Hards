import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App, { AppRoutes } from '../App';
import { AuthProvider } from '../auth/AuthProvider';
import { fetchVideo, fetchVideos } from '../videos/videosApi';

jest.mock('../videos/videosApi', () => ({
  ...jest.requireActual('../videos/videosApi'),
  fetchVideos: jest.fn(),
  fetchVideo: jest.fn(),
}));
const mockedFetchVideos = fetchVideos as jest.MockedFunction<typeof fetchVideos>;
const mockedFetchVideo = fetchVideo as jest.MockedFunction<typeof fetchVideo>;

const renderAt = (path: string) =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>
  );

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedFetchVideos.mockReset();
    mockedFetchVideo.mockReset();
    mockedFetchVideos.mockResolvedValue({
      content: [{ id: 1, title: 'Video 1', author: 'Author', durationSeconds: 60, thumbnailUrl: '/media/1.webp' }],
      page: 0,
      size: 12,
      totalElements: 1,
      totalPages: 1,
    });
    mockedFetchVideo.mockResolvedValue({
      id: 1,
      title: 'Video 1',
      description: 'Description',
      author: 'Author',
      durationSeconds: 60,
      width: 1280,
      height: 720,
      publishedAt: '2024-01-01T00:00:00Z',
      videoUrl: '/media/1.mp4',
      thumbnailUrl: '/media/1.webp',
      comments: [],
    });
  });

  it('shows the video list on the home page', async () => {
    render(<App />);

    expect(await screen.findByRole('img', { name: 'Video 1' })).toBeInTheDocument();
  });

  it('opens the page of a video from the list', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(await screen.findByRole('link', { name: 'Video 1' }));

    expect(await screen.findByLabelText('Video player: Video 1')).toBeInTheDocument();
    expect(mockedFetchVideo).toHaveBeenCalledWith(1);
  });

  it('goes to the login page and back home from the navbar', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Videos' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ProTube' }));
    expect(await screen.findByRole('list', { name: 'Videos' })).toBeInTheDocument();
  });

  it('opens the settings page from the navbar', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.getByRole('heading', { name: 'Appearance' })).toBeInTheDocument();
  });

  it('shows a not-found page for unknown routes', () => {
    renderAt('/does-not-exist');

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  describe('search', () => {
    it('searches videos from the home page', async () => {
      const user = userEvent.setup();
      renderAt('/');
      await screen.findByRole('list', { name: 'Videos' });

      await user.type(screen.getByRole('combobox', { name: 'Search videos' }), 'video{Enter}');

      expect(await screen.findByRole('list', { name: 'Results for "video"' })).toBeInTheDocument();
      expect(mockedFetchVideos).toHaveBeenCalledWith(0, 12, 'video');
    });

    it('opens the search written in the URL', async () => {
      renderAt('/?q=cats');

      expect(await screen.findByRole('list', { name: 'Results for "cats"' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Search videos' })).toHaveValue('cats');
      expect(mockedFetchVideos).toHaveBeenCalledWith(0, 12, 'cats');
    });

    it('clears the search when going home from the navbar', async () => {
      const user = userEvent.setup();
      renderAt('/?q=cats');
      await screen.findByRole('list', { name: 'Results for "cats"' });

      await user.click(screen.getByRole('button', { name: 'Pro Tube' }));

      expect(await screen.findByRole('list', { name: 'Videos' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Search videos' })).toHaveValue('');
    });
  });
});
