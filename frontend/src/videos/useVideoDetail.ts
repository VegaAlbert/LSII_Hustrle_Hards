import { useCallback, useEffect, useState } from 'react';
import { fetchVideo, isNotFound, type VideoComment, type VideoDetail } from './videosApi';

type Status = 'loading' | 'success' | 'not-found' | 'error';

/**
 * Loads one video with its comments. A missing video ('not-found') is told apart from other errors, which can be
 * retried with retry(). addComment() shows a comment just published (US-09) first, without loading the video again.
 */
export function useVideoDetail(id: number) {
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  // Changing it requests the video again
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchVideo(id)
      .then((result) => {
        if (cancelled) return;
        setVideo(result);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (!cancelled) setStatus(isNotFound(error) ? 'not-found' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  // The backend also returns the comments newest first, so a reload would show the same order
  const addComment = useCallback((comment: VideoComment) => {
    setVideo((current) => (current ? { ...current, comments: [comment, ...current.comments] } : current));
  }, []);

  return { video, status, retry, addComment };
}
