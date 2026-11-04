import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VideoDetailPage from '../VideoDetailPage';
import { fetchVideo, isNotFound, type VideoDetail } from '../../videos/videosApi';

jest.mock('../../videos/videosApi', () => ({
  ...jest.requireActual('../../videos/videosApi'),
  fetchVideo: jest.fn(),
  isNotFound: jest.fn(),
}));
const mockedFetchVideo = fetchVideo as jest.MockedFunction<typeof fetchVideo>;
const mockedIsNotFound = isNotFound as jest.MockedFunction<typeof isNotFound>;

const video: VideoDetail = {
  id: 5,
  title: 'Uptown Funk',
  description: 'Official video',
  author: 'Mark Ronson',
  durationSeconds: 79,
  width: 1920,
  height: 1080,
  publishedAt: '2014-11-19T13:20:18Z',
  videoUrl: '/media/0.mp4',
  thumbnailUrl: '/media/0.webp',
  comments: [{ id: 1, author: 'bob', text: 'Great song', likeCount: 2, publishedAt: null }],
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/videos/:id" element={<VideoDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('VideoDetailPage', () => {
  beforeEach(() => {
    mockedFetchVideo.mockReset();
    mockedIsNotFound.mockReset();
  });

  it('plays the video and shows its information and comments', async () => {
    mockedFetchVideo.mockResolvedValueOnce(video);

    renderAt('/videos/5');

    expect(screen.getByRole('status')).toHaveTextContent('Loading video...');
    const player = await screen.findByLabelText('Video player: Uptown Funk');
    expect(player).toHaveAttribute('src', 'development/0.mp4');
    expect(player).toHaveAttribute('poster', 'development/0.webp');
    expect(player).toHaveAttribute('controls');
    expect(mockedFetchVideo).toHaveBeenCalledWith(5);

    expect(screen.getByRole('heading', { level: 1, name: 'Uptown Funk' })).toBeInTheDocument();
    expect(screen.getByText(/Mark Ronson/)).toBeInTheDocument();
    expect(screen.getByText('19 November 2014')).toBeInTheDocument();
    expect(screen.getByText('1:19')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About this video' })).toBeInTheDocument();
    expect(screen.getByText('Official video')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comments 1' })).toBeInTheDocument();
    expect(screen.getByText('Great song')).toBeInTheDocument();
  });

  it('leaves out the author and description when they are unknown', async () => {
    mockedFetchVideo.mockResolvedValueOnce({ ...video, author: null, description: null });

    renderAt('/videos/5');

    expect(await screen.findByRole('heading', { level: 1, name: 'Uptown Funk' })).toBeInTheDocument();
    expect(screen.queryByText(/Mark Ronson/)).not.toBeInTheDocument();
    expect(screen.queryByText('Official video')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'About this video' })).not.toBeInTheDocument();
  });

  it('shows a not-found state when the video does not exist', async () => {
    const error = new Error('404');
    mockedFetchVideo.mockRejectedValueOnce(error);
    mockedIsNotFound.mockReturnValueOnce(true);

    renderAt('/videos/999');

    expect(await screen.findByRole('heading', { name: 'Video not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
    expect(screen.queryByLabelText(/Video player/)).not.toBeInTheDocument();
    expect(mockedIsNotFound).toHaveBeenCalledWith(error);
  });

  it('shows a not-found state without requesting an invalid id', () => {
    renderAt('/videos/abc');

    expect(screen.getByRole('heading', { name: 'Video not found' })).toBeInTheDocument();
    expect(mockedFetchVideo).not.toHaveBeenCalled();
  });

  it('shows an error and loads the video again on retry', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce(video);
    mockedIsNotFound.mockReturnValue(false);

    renderAt('/videos/5');

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the video.');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Uptown Funk' })).toBeInTheDocument();
    expect(mockedFetchVideo).toHaveBeenCalledTimes(2);
  });
});
