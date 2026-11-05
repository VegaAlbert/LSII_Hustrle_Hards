import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import UploadPage from '../UploadPage';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { readVideoFile } from '../../videos/videoFile';
import { uploadVideo, type VideoDetail } from '../../videos/videosApi';

jest.mock('../../videos/videoFile', () => ({
  ...jest.requireActual('../../videos/videoFile'),
  readVideoFile: jest.fn(),
}));
jest.mock('../../videos/videosApi', () => ({
  ...jest.requireActual('../../videos/videosApi'),
  uploadVideo: jest.fn(),
}));
const mockedReadVideoFile = readVideoFile as jest.MockedFunction<typeof readVideoFile>;
const mockedUploadVideo = uploadVideo as jest.MockedFunction<typeof uploadVideo>;

const alice = { id: 1, username: 'alice', email: 'alice@example.com' };
const frames = [new Blob(['a'], { type: 'image/jpeg' }), new Blob(['b'], { type: 'image/jpeg' })];
const videoFile = new File(['video'], 'my_summer-trip.mp4', { type: 'video/mp4' });

const published = { id: 42 } as VideoDetail;

const VideoPage = () => <p>Video page {useLocation().pathname}</p>;
const LoginPage = () => <p>Login page from {(useLocation().state as { from: string }).from}</p>;

const renderPage = (user: AuthContextValue['user'] = alice) =>
  render(
    <AuthContext.Provider
      value={{ user, login: jest.fn(), register: jest.fn(), loginWithGoogle: jest.fn(), logout: jest.fn() }}
    >
      <MemoryRouter initialEntries={['/upload']}>
        <Routes>
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/videos/:id" element={<VideoPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

const chooseVideo = async (user: ReturnType<typeof userEvent.setup>, file: File = videoFile) => {
  await user.upload(screen.getByLabelText('Select video file'), file);
};

describe('UploadPage', () => {
  beforeEach(() => {
    mockedReadVideoFile.mockReset();
    mockedUploadVideo.mockReset();
    mockedReadVideoFile.mockResolvedValue({ durationSeconds: 125, width: 1920, height: 1080, frames });
    URL.createObjectURL = jest.fn(() => 'blob:preview');
    URL.revokeObjectURL = jest.fn();
  });

  it('sends visitors who are not logged in to the login page', () => {
    renderPage(null);

    expect(screen.getByText('Login page from /upload')).toBeInTheDocument();
  });

  it('asks for a video file first', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Upload video' })).toBeInTheDocument();
    expect(screen.getByText('Drag and drop a video file to upload')).toBeInTheDocument();
    expect(screen.queryByLabelText('Title (required)')).not.toBeInTheDocument();
  });

  it('rejects a file that is not an MP4 or WebM video', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderPage();

    await chooseVideo(user, new File(['x'], 'clip.avi', { type: 'video/x-msvideo' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Choose an MP4 or WebM video.');
    expect(screen.queryByLabelText('Title (required)')).not.toBeInTheDocument();
  });

  it('accepts a video dropped on the drop zone', async () => {
    renderPage();
    const dropzone = screen.getByText('Drag and drop a video file to upload').closest('label') as HTMLElement;

    fireEvent.dragOver(dropzone);
    expect(dropzone).toHaveClass('is-dragging');
    fireEvent.drop(dropzone, { dataTransfer: { files: [videoFile] } });

    expect(await screen.findByLabelText('Title (required)')).toHaveValue('my summer trip');
  });

  it('shows the details form with the file information and the suggested thumbnails', async () => {
    const user = userEvent.setup();
    renderPage();

    await chooseVideo(user);

    expect(screen.getByLabelText('Title (required)')).toHaveValue('my summer trip');
    expect(screen.getByText('14/100')).toBeInTheDocument();
    expect(screen.getByLabelText('Preview of your video')).toHaveAttribute('src', 'blob:preview');
    expect(screen.getByText('my_summer-trip.mp4')).toBeInTheDocument();
    expect(await screen.findByText('2:05 · 1920×1080')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use frame 1 as thumbnail' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Use frame 2 as thumbnail' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('publishes the video with all its details and opens its page', async () => {
    const user = userEvent.setup();
    mockedUploadVideo.mockImplementation(async (_metadata, _video, _thumbnail, onProgress) => {
      onProgress?.(0.5);
      return published;
    });
    renderPage();
    await chooseVideo(user);
    await screen.findByText('2:05 · 1920×1080');

    const title = screen.getByLabelText('Title (required)');
    await user.clear(title);
    await user.type(title, 'Summer in Girona');
    await user.type(screen.getByLabelText('Description'), 'Best trip ever #travel #summer');
    expect(screen.getByText('#travel')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Tags'), 'beach{Enter}#Road trip,');
    await user.selectOptions(screen.getByLabelText('Category'), 'TRAVEL_AND_EVENTS');
    await user.click(screen.getByLabelText('Yes, restrict my video to viewers over 18'));
    await user.click(screen.getByRole('button', { name: 'Use frame 2 as thumbnail' }));

    await user.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByText('Video page /videos/42')).toBeInTheDocument();
    expect(mockedUploadVideo).toHaveBeenCalledWith(
      {
        title: 'Summer in Girona',
        description: 'Best trip ever #travel #summer',
        tags: ['beach', 'Road trip'],
        category: 'TRAVEL_AND_EVENTS',
        ageRestricted: true,
        durationSeconds: 125,
        width: 1920,
        height: 1080,
      },
      videoFile,
      frames[1],
      expect.any(Function)
    );
  });

  it('uses a custom thumbnail image', async () => {
    const user = userEvent.setup();
    mockedUploadVideo.mockResolvedValue(published);
    const image = new File(['img'], 'cover.png', { type: 'image/png' });
    renderPage();
    await chooseVideo(user);
    await screen.findByText('2:05 · 1920×1080');

    await user.upload(screen.getByLabelText('Upload thumbnail image'), image);
    expect(screen.getByRole('button', { name: 'Use your image as thumbnail' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(mockedUploadVideo).toHaveBeenCalled());
    expect(mockedUploadVideo.mock.calls[0][2]).toBe(image);
  });

  it('rejects a thumbnail that is too big', async () => {
    const user = userEvent.setup();
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' });
    renderPage();
    await chooseVideo(user);

    await user.upload(screen.getByLabelText('Upload thumbnail image'), big);

    expect(screen.getByText('The thumbnail must be at most 2 MB.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use your image as thumbnail' })).not.toBeInTheDocument();
  });

  it('requires a title and a thumbnail', async () => {
    const user = userEvent.setup();
    mockedReadVideoFile.mockResolvedValue({ durationSeconds: 3, width: null, height: null, frames: [] });
    renderPage();
    await chooseVideo(user);
    await screen.findByText('0:03');

    await user.clear(screen.getByLabelText('Title (required)'));
    await user.click(screen.getByRole('button', { name: 'Publish' }));

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Choose a thumbnail for your video')).toBeInTheDocument();
    expect(mockedUploadVideo).not.toHaveBeenCalled();
  });

  it('shows the errors returned by the server', async () => {
    const user = userEvent.setup();
    const response = {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { message: 'Invalid data', fieldErrors: { title: 'Title must be at most 100 characters' } },
    };
    mockedUploadVideo.mockRejectedValue(new AxiosError('Bad Request', '400', undefined, undefined, response));
    renderPage();
    await chooseVideo(user);
    await screen.findByText('2:05 · 1920×1080');

    await user.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid data');
    expect(screen.getByText('Title must be at most 100 characters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled();
  });

  it('asks to log in again when the session has expired', async () => {
    const user = userEvent.setup();
    const response = { status: 401, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: {} };
    mockedUploadVideo.mockRejectedValue(new AxiosError('Unauthorized', '401', undefined, undefined, response));
    renderPage();
    await chooseVideo(user);
    await screen.findByText('2:05 · 1920×1080');

    await user.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your session has expired');
  });

  it('shows the progress while uploading', async () => {
    const user = userEvent.setup();
    let progress: (fraction: number) => void = () => {};
    mockedUploadVideo.mockImplementation((_metadata, _video, _thumbnail, onProgress) => {
      progress = onProgress ?? progress;
      return new Promise(() => {});
    });
    renderPage();
    await chooseVideo(user);
    await screen.findByText('2:05 · 1920×1080');

    await user.click(screen.getByRole('button', { name: 'Publish' }));
    act(() => progress(0.4));

    expect(screen.getByRole('status')).toHaveTextContent('Uploading... 40%');
    expect(screen.getByRole('button', { name: 'Publishing...' })).toBeDisabled();
  });

  it('lets the user choose another file when the video cannot be read', async () => {
    const user = userEvent.setup();
    mockedReadVideoFile.mockRejectedValue(new Error('broken'));
    renderPage();
    await chooseVideo(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not read my_summer-trip.mp4');
    await user.click(screen.getByRole('button', { name: 'Choose another file' }));

    expect(screen.getByText('Drag and drop a video file to upload')).toBeInTheDocument();
  });
});
