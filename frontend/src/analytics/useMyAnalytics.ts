import { useCallback, useEffect, useState } from 'react';
import { isUnauthorized } from '../auth/authApi';
import { fetchMyAnalytics, type Analytics } from './analyticsApi';

type Status = 'loading' | 'success' | 'unauthorized' | 'error';

/**
 * Loads the analytics of the logged-in user (US-11). A rejected session ('unauthorized') is told apart from other
 * errors, which can be retried with retry().
 */
export function useMyAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  // Changing it requests the analytics again
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchMyAnalytics()
      .then((result) => {
        if (cancelled) return;
        setAnalytics(result);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (!cancelled) setStatus(isUnauthorized(error) ? 'unauthorized' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  return { analytics, status, retry };
}
