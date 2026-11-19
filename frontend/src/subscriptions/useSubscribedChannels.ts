import { useCallback, useEffect, useState } from 'react';
import { fetchSubscribedChannels, type SubscriptionState } from './subscriptionsApi';

type Status = 'loading' | 'success' | 'error';

/**
 * US-13: loads the channels the logged-in user is subscribed to; retry() repeats a failed request.
 */
export function useSubscribedChannels() {
  const [channels, setChannels] = useState<SubscriptionState[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  // Changing it requests the list again
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchSubscribedChannels()
      .then((result) => {
        if (cancelled) return;
        setChannels(result);
        setStatus('success');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((current) => current + 1);
  }, []);

  return { channels, status, retry };
}
