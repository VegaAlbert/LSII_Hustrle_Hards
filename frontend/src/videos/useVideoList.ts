import { useCallback, useEffect, useState } from 'react';
import { fetchVideos, type VideoSummary } from './videosApi';

export const PAGE_SIZE = 12;

type Status = 'loading' | 'success' | 'error';

/**
 * Loads the video list page by page: loadMore() appends the next page, retry() repeats a failed request.
 */
export function useVideoList() {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<Status>('loading');
  // Changing it requests the current page again
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchVideos(page, PAGE_SIZE)
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
