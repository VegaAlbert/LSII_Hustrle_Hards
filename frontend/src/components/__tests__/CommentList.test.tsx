import { render, screen, within } from '@testing-library/react';
import CommentList from '../CommentList';
import type { VideoComment } from '../../videos/videosApi';

const comment = (id: number, likeCount: number): VideoComment => ({
  id,
  author: `user${id}`,
  text: `Comment ${id}`,
  likeCount,
  publishedAt: null,
});

describe('CommentList', () => {
  it('shows every comment with its author, text and likes', () => {
    render(<CommentList comments={[comment(1, 3), comment(2, 1)]} />);

    expect(screen.getByRole('heading', { name: 'Comments (2)' })).toBeInTheDocument();
    const items = within(screen.getByRole('list', { name: 'Comments' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('user1')).toBeInTheDocument();
    expect(within(items[0]).getByText('Comment 1')).toBeInTheDocument();
    expect(within(items[0]).getByText('3 likes')).toBeInTheDocument();
    expect(within(items[1]).getByText('1 like')).toBeInTheDocument();
  });

  it('says when there are no comments', () => {
    render(<CommentList comments={[]} />);

    expect(screen.getByRole('heading', { name: 'Comments (0)' })).toBeInTheDocument();
    expect(screen.getByText('No comments yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Comments' })).not.toBeInTheDocument();
  });
});
