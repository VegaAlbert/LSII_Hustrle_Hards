import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import EditVideoPage from '../EditVideoPage';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { fetchVideo, isNotFound, updateVideo, type VideoDetail } from '../../videos/videosApi';

jest.mock('../../videos/videosApi', () => ({
  ...jest.requireActual('../../videos/videosApi'),
  fetchVideo: jest.fn(),
  isNotFound: jest.fn(),
  updateVideo: jest.fn(),
}));
const mockedFetchVideo = fetchVideo as jest.MockedFunction<typeof fetchVideo>;
const mockedIsNotFound = isNotFound as jest.MockedFunction<typeof isNotFound>;
const mockedUpdateVideo = updateVideo as jest.MockedFunction<typeof updateVideo>;

const alice = { id: 1, username: 'alice', email: 'alice@example.com' };
const bob = { id: 2, username: 'bob', email: 'bob@example.com' };

const video: VideoDetail = {
  id: 7,
  title: 'Summer in Girona',
  description: 'Best trip #travel',
  author: 'alice',
  durationSeconds: 125,
  width: 1920,
  height: 1080,
  publishedAt: '2026-11-05T10:00:00Z',
  videoUrl: '/media/upload-1.mp4',
  thumbnailUrl: '/media/upload-1-thumbnail.jpg',
  tags: ['beach'],
  category: 'TRAVEL_AND_EVENTS',
  ageRestricted: false,
  uploader: 'alice',
  comments: [],
};

const apiError = (status: number, data: object) =>
  new AxiosError('error', String(status), undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

const VideoPage = () => <p>Video page {useLocation().pathname}</p>;
const LoginPage = () => <p>Login page from {(useLocation().state as { from: string }).from}</p>;

const renderAt = (path: string, user: AuthContextValue['user'] = alice) =>
  render(
    <AuthContext.Provider
      value={{ user, login: jest.fn(), register: jest.fn(), loginWithGoogle: jest.fn(), logout: jest.fn() }}
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/videos/:id/edit" element={<EditVideoPage />} />
          <Route path="/videos/:id" element={<VideoPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('EditVideoPage', () => {
  beforeEach(() => {
    mockedFetchVideo.mockReset();
    mockedIsNotFound.mockReset();
    mockedUpdateVideo.mockReset();
  });

  it('sends visitors who are not logged in to the login page', () => {
    renderAt('/videos/7/edit', null);

    expect(screen.getByText('Login page from /videos/7/edit')).toBeInTheDocument();
    expect(mockedFetchVideo).not.toHaveBeenCalled();
  });

  it('fills the form with the current metadata of the video', async () => {
    mockedFetchVideo.mockResolvedValueOnce(video);

    renderAt('/videos/7/edit');

    expect(screen.getByRole('status')).toHaveTextContent('Loading video...');
    expect(await screen.findByLabelText('Title (required)')).toHaveValue('Summer in Girona');
    expect(screen.getByLabelText('Description')).toHaveValue('Best trip #travel');
    expect(screen.getByRole('button', { name: 'Remove tag beach' })).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toHaveValue('TRAVEL_AND_EVENTS');
    expect(screen.getByLabelText('No, it is suitable for everyone')).toBeChecked();
    expect(screen.getByRole('img', { name: 'Thumbnail of Summer in Girona' })).toHaveAttribute(
      'src',
      'development/upload-1-thumbnail.jpg'
    );
    expect(screen.getByText('5 November 2026')).toBeInTheDocument();
    expect(screen.getByText('2:05')).toBeInTheDocument();
    // Nothing to save until something changes
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('saves the changes and goes back to the video page', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockResolvedValueOnce(video);
    mockedUpdateVideo.mockResolvedValueOnce({ ...video, title: 'Girona 2026' });
    renderAt('/videos/7/edit');

    const title = await screen.findByLabelText('Title (required)');
    await user.clear(title);
    await user.type(title, 'Girona 2026');
    await user.type(screen.getByLabelText('Description'), ' #summer');
    await user.click(screen.getByRole('button', { name: 'Remove tag beach' }));
    await user.type(screen.getByLabelText('Tags'), 'sea{Enter}');
    await user.selectOptions(screen.getByLabelText('Category'), '');
    await user.click(screen.getByLabelText('Yes, restrict my video to viewers over 18'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Video page /videos/7')).toBeInTheDocument();
    expect(mockedUpdateVideo).toHaveBeenCalledWith(7, {
      title: 'Girona 2026',
      description: 'Best trip #travel #summer',
      tags: ['sea'],
      category: null,
      ageRestricted: true,
    });
  });

  it('requires a title', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockResolvedValueOnce(video);
    renderAt('/videos/7/edit');

    await user.clear(await screen.findByLabelText('Title (required)'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(mockedUpdateVideo).not.toHaveBeenCalled();
  });

  it('shows the errors returned by the server', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockResolvedValueOnce(video);
    mockedUpdateVideo.mockRejectedValueOnce(
      apiError(403, { message: 'You can only edit your own videos (video 7)', fieldErrors: {} })
    );
    renderAt('/videos/7/edit');

    await user.type(await screen.findByLabelText('Description'), '!');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('You can only edit your own videos (video 7)');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('asks to log in again when the session has expired', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockResolvedValueOnce(video);
    mockedUpdateVideo.mockRejectedValueOnce(apiError(401, {}));
    renderAt('/videos/7/edit');

    await user.type(await screen.findByLabelText('Description'), '!');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your session has expired');
  });

  it('goes back to the video without saving on Cancel', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockResolvedValueOnce(video);
    renderAt('/videos/7/edit');

    await user.click(await screen.findByRole('link', { name: 'Cancel' }));

    expect(screen.getByText('Video page /videos/7')).toBeInTheDocument();
    expect(mockedUpdateVideo).not.toHaveBeenCalled();
  });

  it('does not let other users edit the video', async () => {
    mockedFetchVideo.mockResolvedValueOnce(video);

    renderAt('/videos/7/edit', bob);

    expect(await screen.findByRole('alert')).toHaveTextContent('You can only edit your own videos.');
    expect(screen.getByRole('link', { name: 'Back to the video' })).toHaveAttribute('href', '/videos/7');
    expect(screen.queryByLabelText('Title (required)')).not.toBeInTheDocument();
  });

  it('shows a not-found state for a video that does not exist or an invalid id', async () => {
    mockedFetchVideo.mockRejectedValueOnce(new Error('404'));
    mockedIsNotFound.mockReturnValueOnce(true);
    const { unmount } = renderAt('/videos/999/edit');

    expect(await screen.findByRole('heading', { name: 'Video not found' })).toBeInTheDocument();
    unmount();

    renderAt('/videos/abc/edit');
    expect(screen.getByRole('heading', { name: 'Video not found' })).toBeInTheDocument();
  });

  it('shows an error and loads the video again on retry', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce(video);
    mockedIsNotFound.mockReturnValue(false);
    renderAt('/videos/7/edit');

    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByLabelText('Title (required)')).toHaveValue('Summer in Girona');
  });
});
