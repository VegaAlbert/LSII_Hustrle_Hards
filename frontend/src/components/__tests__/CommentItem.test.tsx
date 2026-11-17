import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AxiosError, type AxiosResponse } from 'axios';
import CommentItem from '../CommentItem';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { postReply, setCommentLike, type VideoComment } from '../../videos/videosApi';

jest.mock('../../videos/videosApi', () => ({
  ...jest.requireActual('../../videos/videosApi'),
  postReply: jest.fn(),
  setCommentLike: jest.fn(),
}));
const mockedPostReply = postReply as jest.MockedFunction<typeof postReply>;
const mockedSetCommentLike = setCommentLike as jest.MockedFunction<typeof setCommentLike>;

const alice = { id: 1, username: 'alice', email: 'alice@example.com' };

const bobComment = (overrides: Partial<VideoComment> = {}): VideoComment => ({
  id: 7,
  author: 'bob',
  text: 'Great song',
  likeCount: 2,
  publishedAt: null,
  likedByMe: false,
  replies: [],
  ...overrides,
});

// Shows where the login redirect sends the user back to
const LoginStub = () => {
  const from = (useLocation().state as { from?: string } | null)?.from;
  return <p>Login page, back to {from}</p>;
};

const httpError = (status: number) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: {},
  } as AxiosResponse);

const renderItem = (user: AuthContextValue['user'], comment = bobComment()) => {
  const onReplyAdded = jest.fn();
  const onLikeChanged = jest.fn();
  render(
    <AuthContext.Provider
      value={{ user, login: jest.fn(), register: jest.fn(), loginWithGoogle: jest.fn(), logout: jest.fn() }}
    >
      <MemoryRouter initialEntries={['/videos/5']}>
        <Routes>
          <Route
            path="/videos/:id"
            element={
              <ul>
                <CommentItem videoId={5} comment={comment} onReplyAdded={onReplyAdded} onLikeChanged={onLikeChanged} />
              </ul>
            }
          />
          <Route path="/login" element={<LoginStub />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
  return { onReplyAdded, onLikeChanged };
};

describe('CommentItem', () => {
  beforeEach(() => {
    mockedPostReply.mockReset();
    mockedSetCommentLike.mockReset();
  });

  it('shows the like button as not pressed with the count', () => {
    renderItem(alice);

    const like = screen.getByRole('button', { name: 'Like comment by @bob, 2 likes' });
    expect(like).toHaveAttribute('aria-pressed', 'false');
  });

  it('likes the comment and reports the new count', async () => {
    const user = userEvent.setup();
    mockedSetCommentLike.mockResolvedValueOnce({ likeCount: 3, liked: true });
    const { onLikeChanged } = renderItem(alice);

    await user.click(screen.getByRole('button', { name: /Like comment by @bob/ }));

    expect(mockedSetCommentLike).toHaveBeenCalledWith(5, 7, true);
    expect(onLikeChanged).toHaveBeenCalledWith(7, { likeCount: 3, liked: true });
  });

  it('unlikes a comment the user already likes', async () => {
    const user = userEvent.setup();
    mockedSetCommentLike.mockResolvedValueOnce({ likeCount: 2, liked: false });
    const { onLikeChanged } = renderItem(alice, bobComment({ likeCount: 3, likedByMe: true }));

    const like = screen.getByRole('button', { name: 'Like comment by @bob, 3 likes' });
    expect(like).toHaveAttribute('aria-pressed', 'true');
    await user.click(like);

    expect(mockedSetCommentLike).toHaveBeenCalledWith(5, 7, false);
    expect(onLikeChanged).toHaveBeenCalledWith(7, { likeCount: 2, liked: false });
  });

  it('shows an error when the like fails', async () => {
    const user = userEvent.setup();
    mockedSetCommentLike.mockRejectedValueOnce(httpError(500));
    const { onLikeChanged } = renderItem(alice);

    await user.click(screen.getByRole('button', { name: /Like comment by @bob/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not update the like.');
    expect(onLikeChanged).not.toHaveBeenCalled();
  });

  it('asks to log in again when the session expired', async () => {
    const user = userEvent.setup();
    mockedSetCommentLike.mockRejectedValueOnce(httpError(401));
    renderItem(alice);

    await user.click(screen.getByRole('button', { name: /Like comment by @bob/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your session has expired. Log in again to like.');
  });

  it('sends anonymous visitors to log in when they like', async () => {
    const user = userEvent.setup();
    renderItem(null);

    await user.click(screen.getByRole('button', { name: /Like comment by @bob/ }));

    expect(screen.getByText('Login page, back to /videos/5')).toBeInTheDocument();
    expect(mockedSetCommentLike).not.toHaveBeenCalled();
  });

  it('sends anonymous visitors to log in when they reply', async () => {
    const user = userEvent.setup();
    renderItem(null);

    await user.click(screen.getByRole('button', { name: 'Reply to @bob' }));

    expect(screen.getByText('Login page, back to /videos/5')).toBeInTheDocument();
  });

  it('opens the reply form and closes it with cancel', async () => {
    const user = userEvent.setup();
    renderItem(alice);

    const replyButton = screen.getByRole('button', { name: 'Reply to @bob' });
    expect(replyButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(replyButton);

    expect(screen.getByLabelText('Add a reply')).toHaveFocus();
    expect(replyButton).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('Add a reply')).not.toBeInTheDocument();
  });

  it('publishes a reply to the comment and closes the form', async () => {
    const user = userEvent.setup();
    const reply = bobComment({ id: 9, author: 'alice', text: 'Agree', likeCount: 0 });
    mockedPostReply.mockResolvedValueOnce(reply);
    const { onReplyAdded } = renderItem(alice);

    await user.click(screen.getByRole('button', { name: 'Reply to @bob' }));
    await user.type(screen.getByLabelText('Add a reply'), '  Agree  ');
    await user.click(screen.getByRole('button', { name: 'Reply' }));

    expect(mockedPostReply).toHaveBeenCalledWith(5, 7, 'Agree');
    expect(onReplyAdded).toHaveBeenCalledWith(7, reply);
    expect(screen.queryByLabelText('Add a reply')).not.toBeInTheDocument();
  });

  it('shows the replies without a reply button of their own', () => {
    renderItem(alice, bobComment({ replies: [bobComment({ id: 9, author: 'alice', text: 'Agree', likeCount: 1 })] }));

    expect(screen.getByRole('list', { name: 'Replies to @bob' })).toBeInTheDocument();
    expect(screen.getByText('Agree')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Like comment by @alice, 1 like' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Reply to/ })).toHaveLength(1);
  });
});
