import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VideoDetailPage from '../VideoDetailPage';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import {
  fetchVideo,
  isNotFound,
  postComment,
  postReply,
  setCommentLike,
  type VideoDetail,
} from '../../videos/videosApi';

jest.mock('../../videos/videosApi', () => ({
  ...jest.requireActual('../../videos/videosApi'),
  fetchVideo: jest.fn(),
  isNotFound: jest.fn(),
  postComment: jest.fn(),
  postReply: jest.fn(),
  setCommentLike: jest.fn(),
}));
const mockedPostComment = postComment as jest.MockedFunction<typeof postComment>;
const mockedPostReply = postReply as jest.MockedFunction<typeof postReply>;
const mockedSetCommentLike = setCommentLike as jest.MockedFunction<typeof setCommentLike>;
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
  tags: [],
  category: null,
  ageRestricted: false,
  comments: [
    {
      id: 1,
      author: 'bob',
      text: 'Great song',
      likeCount: 2,
      publishedAt: null,
      likedByMe: false,
      replies: [
        { id: 3, author: 'carol', text: 'So true', likeCount: 0, publishedAt: null, likedByMe: false, replies: [] },
      ],
    },
  ],
};

const alice = { id: 1, username: 'alice', email: 'alice@example.com' };

const renderAt = (path: string, user: AuthContextValue['user'] = null) =>
  render(
    <AuthContext.Provider
      value={{ user, login: jest.fn(), register: jest.fn(), loginWithGoogle: jest.fn(), logout: jest.fn() }}
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/videos/:id" element={<VideoDetailPage />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('VideoDetailPage', () => {
  beforeEach(() => {
    mockedFetchVideo.mockReset();
    mockedIsNotFound.mockReset();
    mockedPostComment.mockReset();
    mockedPostReply.mockReset();
    mockedSetCommentLike.mockReset();
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
    expect(screen.getByRole('heading', { name: 'Comments 2' })).toBeInTheDocument();
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

  it('links the hashtags and tags of the video to a search', async () => {
    mockedFetchVideo.mockResolvedValueOnce({
      ...video,
      description: 'Live in London #funk #live #music #2014',
      tags: ['Bruno Mars', 'pop'],
      category: 'MUSIC',
    });

    renderAt('/videos/5');

    const hashtags = await screen.findByLabelText('Hashtags');
    expect(
      within(hashtags)
        .getAllByRole('link')
        .map((link) => link.textContent)
    ).toEqual(['#funk', '#live', '#music']);
    expect(within(hashtags).getByRole('link', { name: '#funk' })).toHaveAttribute('href', '/?q=%23funk');
    // In the description every hashtag is a link, the 4th one too
    expect(screen.getAllByRole('link', { name: '#2014' })).toHaveLength(1);
    const tags = screen.getByRole('list', { name: 'Tags' });
    expect(within(tags).getByRole('link', { name: 'Bruno Mars' })).toHaveAttribute('href', '/?q=Bruno%20Mars');
    expect(screen.getByText('Music')).toBeInTheDocument();
  });

  it('starts at the second given in the link', async () => {
    mockedFetchVideo.mockResolvedValueOnce(video);

    renderAt('/videos/5?t=42');

    const player = (await screen.findByLabelText('Video player: Uptown Funk')) as HTMLVideoElement;
    fireEvent.loadedMetadata(player);
    expect(player.currentTime).toBe(42);
  });

  it('opens the share dialog with the link of the video', async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    mockedFetchVideo.mockResolvedValueOnce(video);
    renderAt('/videos/5');

    await user.click(await screen.findByRole('button', { name: 'Share' }));

    const dialog = screen.getByRole('dialog', { name: 'Share' });
    const link = `${window.location.origin}/videos/5`;
    expect(within(dialog).getByLabelText('Video link')).toHaveValue(link);
    expect(within(dialog).getByRole('link', { name: 'Share on WhatsApp' })).toHaveAttribute(
      'href',
      `https://wa.me/?text=Uptown%20Funk%20${encodeURIComponent(link)}`
    );
    await user.click(within(dialog).getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith(link);
    expect(within(dialog).getByRole('button', { name: 'Copied' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks anonymous visitors to log in before playing an age-restricted video', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockResolvedValueOnce({ ...video, ageRestricted: true });
    renderAt('/videos/5');

    expect(await screen.findByRole('region', { name: 'Age-restricted video' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Video player: Uptown Funk')).not.toBeInTheDocument();
    expect(screen.getAllByText('18+').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('link', { name: 'Log in' }));
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('plays an age-restricted video once a logged-in viewer confirms their age', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockResolvedValueOnce({ ...video, ageRestricted: true });
    renderAt('/videos/5', alice);

    await user.click(await screen.findByRole('button', { name: 'I am over 18, play the video' }));

    expect(screen.getByLabelText('Video player: Uptown Funk')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Age-restricted video' })).not.toBeInTheDocument();
  });

  it('shows a new comment first under the video', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockResolvedValueOnce(video);
    mockedPostComment.mockResolvedValueOnce({
      id: 2,
      author: 'alice',
      text: 'Love it',
      likeCount: 0,
      publishedAt: new Date().toISOString(),
      likedByMe: false,
      replies: [],
    });
    renderAt('/videos/5', alice);

    await user.type(await screen.findByLabelText('Add a comment'), 'Love it');
    await user.click(screen.getByRole('button', { name: 'Comment' }));

    expect(await screen.findByRole('heading', { name: 'Comments 3' })).toBeInTheDocument();
    expect(mockedPostComment).toHaveBeenCalledWith(5, 'Love it');
    const comments = screen.getByRole('list', { name: 'Comments' });
    const items = within(comments)
      .getAllByRole('listitem')
      .filter((item) => item.parentElement === comments);
    expect(within(items[0]).getByText('Love it')).toBeInTheDocument();
    expect(within(items[1]).getByText('Great song')).toBeInTheDocument();
  });

  it('shows a new reply at the end of the replies of its comment', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockResolvedValueOnce(video);
    mockedPostReply.mockResolvedValueOnce({
      id: 4,
      author: 'alice',
      text: 'Me too',
      likeCount: 0,
      publishedAt: new Date().toISOString(),
      likedByMe: false,
      replies: [],
    });
    renderAt('/videos/5', alice);

    await user.click(await screen.findByRole('button', { name: 'Reply to @bob' }));
    await user.type(screen.getByLabelText('Add a reply'), 'Me too');
    await user.click(screen.getByRole('button', { name: 'Reply' }));

    expect(await screen.findByRole('heading', { name: 'Comments 3' })).toBeInTheDocument();
    expect(mockedPostReply).toHaveBeenCalledWith(5, 1, 'Me too');
    const replies = within(screen.getByRole('list', { name: 'Replies to @bob' })).getAllByRole('listitem');
    expect(replies).toHaveLength(2);
    expect(within(replies[1]).getByText('Me too')).toBeInTheDocument();
  });

  it('updates the like count and state of a comment', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockResolvedValueOnce(video);
    mockedSetCommentLike.mockResolvedValueOnce({ likeCount: 3, liked: true });
    renderAt('/videos/5', alice);

    await user.click(await screen.findByRole('button', { name: 'Like comment by @bob, 2 likes' }));

    const like = await screen.findByRole('button', { name: 'Like comment by @bob, 3 likes' });
    expect(like).toHaveAttribute('aria-pressed', 'true');
    expect(mockedSetCommentLike).toHaveBeenCalledWith(5, 1, true);
  });

  it('updates the like of a reply', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockResolvedValueOnce(video);
    mockedSetCommentLike.mockResolvedValueOnce({ likeCount: 1, liked: true });
    renderAt('/videos/5', alice);

    await user.click(await screen.findByRole('button', { name: 'Like comment by @carol, 0 likes' }));

    expect(await screen.findByRole('button', { name: 'Like comment by @carol, 1 like' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(mockedSetCommentLike).toHaveBeenCalledWith(5, 3, true);
  });

  it('asks anonymous visitors to log in to comment', async () => {
    const user = userEvent.setup();
    mockedFetchVideo.mockResolvedValueOnce(video);
    renderAt('/videos/5');

    await user.click(await screen.findByRole('link', { name: 'Log in to comment' }));

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
