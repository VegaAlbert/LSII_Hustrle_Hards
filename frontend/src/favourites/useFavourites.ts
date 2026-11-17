import { useCallback, useEffect, useState } from 'react';
import type { VideoSummary } from '../videos/videosApi';
import { fetchFavourites } from './favouritesApi';

export const FAVOURITES_PAGE_SIZE = 12;

type Status = 'loading' | 'success' | 'error';

/**
 * US-12: loads the favourite videos of the logged-in user page by page, like useVideoList: loadMore() appends the
 * next page and retry() repeats a failed request.
 */
export function useFavourites() {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<Status>('loading');
  // Changing it requests the current page again
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchFavourites(page, FAVOURITES_PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;
        setVideos((current) => (page === 0 ? result.content : [...current, ...result.content]));
        setTotalPages(result.totalPages);
        setStatus('success');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [page, attempt]);

  const loadMore = useCallback(() => {
    setStatus('loading');
    setPage((current) => current + 1);
  }, []);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((current) => current + 1);
  }, []);

  return { videos, status, hasMore: page + 1 < totalPages, loadMore, retry };
}
