import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import VideoCard, { PREVIEW_DELAY_MS } from '../VideoCard';
import type { VideoSummary } from '../../videos/videosApi';

const video: VideoSummary = {
  id: 1,
  title: 'My first video',
  author: 'Some Channel',
  durationSeconds: 65,
  publishedAt: '2024-01-01T00:00:00Z',
  thumbnailUrl: '/media/0.webp',
  videoUrl: '/media/0.mp4',
};

const renderCard = (overrides: Partial<VideoSummary> = {}) =>
  render(<VideoCard video={{ ...video, ...overrides }} />, { wrapper: MemoryRouter });

describe('VideoCard', () => {
  it('shows the thumbnail from the media server with the title as alt text', () => {
    renderCard();

    expect(screen.getByRole('img', { name: 'My first video' })).toHaveAttribute('src', 'development/0.webp');
  });

  it('shows the title, author, duration and publication date', () => {
    jest.useFakeTimers({ now: new Date('2024-01-04T00:00:00Z') });
    renderCard();

    expect(screen.getByRole('heading', { name: 'My first video' })).toBeInTheDocument();
    expect(screen.getByText('Some Channel')).toBeInTheDocument();
    expect(screen.getByText('1:05')).toBeInTheDocument();
    expect(screen.getByText('3 days ago')).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('links to the page of the video', () => {
    renderCard();

    expect(screen.getByRole('link', { name: 'My first video' })).toHaveAttribute('href', '/videos/1');
  });

  it('leaves the author out when it is unknown', () => {
    renderCard({ author: null });

    expect(screen.queryByText('Some Channel')).not.toBeInTheDocument();
  });

  describe('hover preview', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const setup = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    it('plays a muted preview of the video after hovering for a moment', async () => {
      const user = setup();
      renderCard();

      await user.hover(screen.getByRole('article'));
      expect(screen.queryByTestId('video-preview')).not.toBeInTheDocument();

      act(() => jest.advanceTimersByTime(PREVIEW_DELAY_MS));

      const preview = screen.getByTestId('video-preview');
      expect(preview).toHaveAttribute('src', 'development/0.mp4');
      expect((preview as HTMLVideoElement).muted).toBe(true);
    });

    it('stops the preview when the mouse leaves', async () => {
      const user = setup();
      renderCard();

      await user.hover(screen.getByRole('article'));
      act(() => jest.advanceTimersByTime(PREVIEW_DELAY_MS));
      await user.unhover(screen.getByRole('article'));

      expect(screen.queryByTestId('video-preview')).not.toBeInTheDocument();
    });

    it('does not start the preview when the mouse leaves before the delay', async () => {
      const user = setup();
      renderCard();

      await user.hover(screen.getByRole('article'));
      await user.unhover(screen.getByRole('article'));
      act(() => jest.advanceTimersByTime(PREVIEW_DELAY_MS));

      expect(screen.queryByTestId('video-preview')).not.toBeInTheDocument();
    });

    it('also plays the preview when the link gets the keyboard focus', async () => {
      const user = setup();
      renderCard();

      await user.tab();
      act(() => jest.advanceTimersByTime(PREVIEW_DELAY_MS));

      expect(screen.getByTestId('video-preview')).toBeInTheDocument();
    });

    it('does not play previews when the user prefers reduced motion', async () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
      const user = setup();
      renderCard();

      await user.hover(screen.getByRole('article'));
      act(() => jest.advanceTimersByTime(PREVIEW_DELAY_MS));

      expect(screen.queryByTestId('video-preview')).not.toBeInTheDocument();
      // @ts-expect-error jsdom has no matchMedia: remove the mock again
      delete window.matchMedia;
    });
  });
});
