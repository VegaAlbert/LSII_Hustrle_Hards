import { render, screen } from '@testing-library/react';
import VideoCard from '../VideoCard';
import type { VideoSummary } from '../../videos/videosApi';

const video: VideoSummary = {
  id: 1,
  title: 'My first video',
  author: 'Some Channel',
  durationSeconds: 65,
  thumbnailUrl: '/media/0.webp',
};

describe('VideoCard', () => {
  it('shows the thumbnail from the media server with the title as alt text', () => {
    render(<VideoCard video={video} />);

    expect(screen.getByRole('img', { name: 'My first video' })).toHaveAttribute('src', 'development/0.webp');
  });

  it('shows the title, author and duration', () => {
    render(<VideoCard video={video} />);

    expect(screen.getByRole('heading', { name: 'My first video' })).toBeInTheDocument();
    expect(screen.getByText('Some Channel')).toBeInTheDocument();
    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('leaves the author out when it is unknown', () => {
    render(<VideoCard video={{ ...video, author: null }} />);

    expect(screen.queryByText('Some Channel')).not.toBeInTheDocument();
  });
});
