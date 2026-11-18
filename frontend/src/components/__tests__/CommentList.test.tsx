import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import CommentList from '../CommentList';
import { AuthContext } from '../../auth/authContext';
import type { VideoComment } from '../../videos/videosApi';
import { I18nProvider } from '../../i18n/I18nProvider';

const comment = (
  id: number,
  likeCount: number,
  publishedAt: string | null = null,
  replies: VideoComment[] = []
): VideoComment => ({
  id,
  author: `user${id}`,
  text: `Comment ${id}`,
  likeCount,
  publishedAt,
  likedByMe: false,
  replies,
});

// CommentItem reads the logged-in user and the current route
const renderList = (comments: VideoComment[], form?: ReactNode) =>
  render(
    <AuthContext.Provider
      value={{ user: null, login: jest.fn(), register: jest.fn(), loginWithGoogle: jest.fn(), logout: jest.fn() }}
    >
      <MemoryRouter>
        <CommentList videoId={5} comments={comments} form={form} onReplyAdded={jest.fn()} onLikeChanged={jest.fn()} />
      </MemoryRouter>
    </AuthContext.Provider>,
    { wrapper: I18nProvider }
  );

describe('CommentList', () => {
  it('shows every comment with its author, text and likes', () => {
    renderList([comment(1, 3), comment(2, 1)]);

    expect(screen.getByRole('heading', { name: 'Comments 2' })).toBeInTheDocument();
    const items = within(screen.getByRole('list', { name: 'Comments' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('@user1')).toBeInTheDocument();
    expect(within(items[0]).getByText('Comment 1')).toBeInTheDocument();
    expect(within(items[0]).getByRole('button', { name: 'Like comment by @user1, 3 likes' })).toBeInTheDocument();
    expect(within(items[1]).getByRole('button', { name: 'Like comment by @user2, 1 like' })).toBeInTheDocument();
  });

  it('shows the replies nested under their comment and counts them', () => {
    renderList([comment(1, 0, null, [comment(3, 0), comment(4, 0)]), comment(2, 0)]);

    expect(screen.getByRole('heading', { name: 'Comments 4' })).toBeInTheDocument();
    const replies = within(screen.getByRole('list', { name: 'Replies to @user1' })).getAllByRole('listitem');
    expect(replies).toHaveLength(2);
    expect(within(replies[0]).getByText('Comment 3')).toBeInTheDocument();
    expect(within(replies[1]).getByText('Comment 4')).toBeInTheDocument();
    // Only one level: replies cannot be answered
    expect(within(replies[0]).queryByRole('button', { name: /Reply to/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Replies to @user2' })).not.toBeInTheDocument();
  });

  it('shows how long ago a comment was published', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    renderList([comment(1, 0, twoDaysAgo), comment(2, 0)]);

    const time = screen.getByText('2 days ago');
    expect(time).toHaveAttribute('dateTime', twoDaysAgo);
    // A comment without a date shows no time at all
    expect(screen.getAllByText(/ago/)).toHaveLength(1);
  });

  it('lets right-to-left texts set their own direction', () => {
    renderList([comment(1, 0)]);

    expect(screen.getByText('Comment 1')).toHaveAttribute('dir', 'auto');
  });

  it('says when there are no comments', () => {
    renderList([]);

    expect(screen.getByRole('heading', { name: 'Comments 0' })).toBeInTheDocument();
    expect(screen.getByText('No comments yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Comments' })).not.toBeInTheDocument();
  });

  it('shows the form slot above the comments', () => {
    renderList([comment(1, 0)], <p>Comment form</p>);

    expect(screen.getByText('Comment form')).toBeInTheDocument();
  });

  describe('in another language', () => {
    afterEach(() => localStorage.clear());

    it('shows the list and the likes in Catalan', () => {
      localStorage.setItem('protube.language', 'ca');
      renderList([comment(1, 3), comment(2, 1)]);

      expect(screen.getByRole('heading', { name: 'Comentaris 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: "M'agrada el comentari de @user1, 3 m'agrada" })).toBeInTheDocument();
    });

    it('shows the empty state in Spanish', () => {
      localStorage.setItem('protube.language', 'es');
      renderList([]);

      expect(screen.getByText('Todavía no hay comentarios.')).toBeInTheDocument();
    });
  });
});
