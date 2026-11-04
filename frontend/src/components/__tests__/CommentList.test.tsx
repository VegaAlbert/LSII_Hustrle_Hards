import { render, screen, within } from '@testing-library/react';
import CommentList from '../CommentList';
import type { VideoComment } from '../../videos/videosApi';

const comment = (id: number, likeCount: number, publishedAt: string | null = null): VideoComment => ({
  id,
  author: `user${id}`,
  text: `Comment ${id}`,
  likeCount,
  publishedAt,
});

describe('CommentList', () => {
  it('shows every comment with its author, text and likes', () => {
    render(<CommentList comments={[comment(1, 3), comment(2, 1)]} />);

    expect(screen.getByRole('heading', { name: 'Comments 2' })).toBeInTheDocument();
    const items = within(screen.getByRole('list', { name: 'Comments' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('@user1')).toBeInTheDocument();
    expect(within(items[0]).getByText('Comment 1')).toBeInTheDocument();
    expect(within(items[0]).getByLabelText('3 likes')).toBeInTheDocument();
    expect(within(items[1]).getByLabelText('1 like')).toBeInTheDocument();
  });

  it('shows how long ago a comment was published', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    render(<CommentList comments={[comment(1, 0, twoDaysAgo), comment(2, 0)]} />);

    const time = screen.getByText('2 days ago');
    expect(time).toHaveAttribute('dateTime', twoDaysAgo);
    // A comment without a date shows no time at all
    expect(screen.getAllByText(/ago/)).toHaveLength(1);
  });

  it('lets right-to-left texts set their own direction', () => {
    render(<CommentList comments={[comment(1, 0)]} />);

    expect(screen.getByText('Comment 1')).toHaveAttribute('dir', 'auto');
  });

  it('says when there are no comments', () => {
    render(<CommentList comments={[]} />);

    expect(screen.getByRole('heading', { name: 'Comments 0' })).toBeInTheDocument();
    expect(screen.getByText('No comments yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Comments' })).not.toBeInTheDocument();
  });
});
