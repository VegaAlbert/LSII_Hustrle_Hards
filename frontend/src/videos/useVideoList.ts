import { useCallback, useEffect, useState } from 'react';
import { fetchVideos, type VideoSummary } from './videosApi';

export const PAGE_SIZE = 12;

type Status = 'loading' | 'success' | 'error';

/**
 * Loads the video list page by page: loadMore() appends the next page, retry() repeats a failed request.
 * A new `query` (US-08) starts again from the first page of its results.
 */
export function useVideoList(query = '') {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<Status>('loading');
  // Changing it requests the current page again
  const [attempt, setAttempt] = useState(0);
  const [currentQuery, setCurrentQuery] = useState(query);

  // Reset while rendering (not in an effect) so the old results are never shown with the new query
  if (query !== currentQuery) {
    setCurrentQuery(query);
    setVideos([]);
    setPage(0);
    setStatus('loading');
  }

  useEffect(() => {
    let cancelled = false;
    fetchVideos(page, PAGE_SIZE, currentQuery)
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
  }, [currentQuery, page, attempt]);

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
