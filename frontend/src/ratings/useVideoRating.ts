import { useCallback, useEffect, useState } from 'react';
import { fetchRating, rateVideo, type VideoRating } from './ratingsApi';

type Status = 'loading' | 'success' | 'error';

/**
 * Loads the ratings of a video and rates it. `username` is only used to load them again when the user logs in or out,
 * so `myScore` belongs to whoever is logged in. rate() rejects when the backend refuses the rating.
 */
export function useVideoRating(videoId: number, username: string | null) {
  const [rating, setRating] = useState<VideoRating | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  // Changing it requests the ratings again
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchRating(videoId)
      .then((result) => {
        if (cancelled) return;
        setRating(result);
        setStatus('success');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [videoId, username, attempt]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  const rate = useCallback(
    async (score: number) => {
      // The backend answers with the new average, so there is no need to request it again
      setRating(await rateVideo(videoId, score));
    },
    [videoId]
  );

  return { rating, status, retry, rate };
}
