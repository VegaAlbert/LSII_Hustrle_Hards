import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoGrid from '../VideoGrid';
import { fetchVideos, type Page, type VideoSummary } from '../../videos/videosApi';

jest.mock('../../videos/videosApi', () => ({
  ...jest.requireActual('../../videos/videosApi'),
  fetchVideos: jest.fn(),
}));
const mockedFetchVideos = fetchVideos as jest.MockedFunction<typeof fetchVideos>;

const video = (id: number): VideoSummary => ({
  id,
  title: `Video ${id}`,
  author: `Author ${id}`,
  durationSeconds: 60 + id,
  thumbnailUrl: `/media/${id}.webp`,
});

const page = (content: VideoSummary[], number: number, totalPages: number): Page<VideoSummary> => ({
  content,
  page: number,
  size: 12,
  totalElements: content.length,
  totalPages,
});

describe('VideoGrid', () => {
  beforeEach(() => {
    mockedFetchVideos.mockReset();
  });

  it('shows a loading message while the first page is requested', async () => {
    mockedFetchVideos.mockResolvedValueOnce(page([video(1)], 0, 1));

    render(<VideoGrid />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading videos...');
    expect(await screen.findByRole('list', { name: 'Videos' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the first page of videos', async () => {
    mockedFetchVideos.mockResolvedValueOnce(page([video(1), video(2)], 0, 1));

    render(<VideoGrid />);

    const list = await screen.findByRole('list', { name: 'Videos' });
    expect(list.children).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'Video 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Video 2' })).toBeInTheDocument();
    expect(mockedFetchVideos).toHaveBeenCalledWith(0, 12);
  });

  it('hides "Load more" when there are no more pages', async () => {
    mockedFetchVideos.mockResolvedValueOnce(page([video(1)], 0, 1));

    render(<VideoGrid />);

    await screen.findByRole('list', { name: 'Videos' });
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('appends the next page when "Load more" is clicked', async () => {
    const user = userEvent.setup();
    mockedFetchVideos
      .mockResolvedValueOnce(page([video(1), video(2)], 0, 2))
      .mockResolvedValueOnce(page([video(3)], 1, 2));

    render(<VideoGrid />);
    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('img', { name: 'Video 3' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Video 1' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Videos' }).children).toHaveLength(3);
    expect(mockedFetchVideos).toHaveBeenLastCalledWith(1, 12);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows a message when there are no videos', async () => {
    mockedFetchVideos.mockResolvedValueOnce(page([], 0, 0));

    render(<VideoGrid />);

    expect(await screen.findByText('No videos available yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Videos' })).not.toBeInTheDocument();
  });

  it('shows an error and loads the videos again on retry', async () => {
    const user = userEvent.setup();
    mockedFetchVideos.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce(page([video(1)], 0, 1));

    render(<VideoGrid />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the videos.');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('img', { name: 'Video 1' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mockedFetchVideos).toHaveBeenCalledTimes(2);
    expect(mockedFetchVideos).toHaveBeenLastCalledWith(0, 12);
  });

  it('keeps the loaded videos when the next page fails and retries that page', async () => {
    const user = userEvent.setup();
    mockedFetchVideos
      .mockResolvedValueOnce(page([video(1)], 0, 2))
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(page([video(2)], 1, 2));

    render(<VideoGrid />);
    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Video 1' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('img', { name: 'Video 2' })).toBeInTheDocument();
    expect(mockedFetchVideos).toHaveBeenLastCalledWith(1, 12);
  });
});
