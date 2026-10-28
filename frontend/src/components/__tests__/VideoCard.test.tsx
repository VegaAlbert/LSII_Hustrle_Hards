import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VideoCard from '../VideoCard';
import type { VideoSummary } from '../../videos/videosApi';

const video: VideoSummary = {
  id: 1,
  title: 'My first video',
  author: 'Some Channel',
  durationSeconds: 65,
  thumbnailUrl: '/media/0.webp',
};

const renderCard = (overrides: Partial<VideoSummary> = {}) =>
  render(<VideoCard video={{ ...video, ...overrides }} />, { wrapper: MemoryRouter });

describe('VideoCard', () => {
  it('shows the thumbnail from the media server with the title as alt text', () => {
    renderCard();

    expect(screen.getByRole('img', { name: 'My first video' })).toHaveAttribute('src', 'development/0.webp');
  });

  it('shows the title, author and duration', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: 'My first video' })).toBeInTheDocument();
    expect(screen.getByText('Some Channel')).toBeInTheDocument();
    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('links to the page of the video', () => {
    renderCard();

    expect(screen.getByRole('link', { name: 'My first video' })).toHaveAttribute('href', '/videos/1');
  });

  it('leaves the author out when it is unknown', () => {
    renderCard({ author: null });

    expect(screen.queryByText('Some Channel')).not.toBeInTheDocument();
  });
});
