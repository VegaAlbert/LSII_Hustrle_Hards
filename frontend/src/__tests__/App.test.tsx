import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { fetchVideos } from '../videos/videosApi';

jest.mock('../videos/videosApi', () => ({
  ...jest.requireActual('../videos/videosApi'),
  fetchVideos: jest.fn(),
}));
const mockedFetchVideos = fetchVideos as jest.MockedFunction<typeof fetchVideos>;

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedFetchVideos.mockReset();
    mockedFetchVideos.mockResolvedValue({
      content: [{ id: 1, title: 'Video 1', author: 'Author', durationSeconds: 60, thumbnailUrl: '/media/1.webp' }],
      page: 0,
      size: 12,
      totalElements: 1,
      totalPages: 1,
    });
  });

  it('shows the video list on the home page', async () => {
    render(<App />);

    expect(await screen.findByRole('img', { name: 'Video 1' })).toBeInTheDocument();
  });

  it('goes to the login page and back home from the navbar', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Videos' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pro Tube' }));
    expect(await screen.findByRole('list', { name: 'Videos' })).toBeInTheDocument();
  });
});
