import { useEffect, useState } from 'react';
import { fetchSubscriberCount } from '../subscriptions/subscriptionsApi';

/**
 * US-13: number of users subscribed to the channel of the logged-in user, shown in their analytics.
 */
const SubscriberCount = () => {
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSubscriberCount()
      .then((value) => {
        if (!cancelled) setCount(value);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  let value = 'Loading...';
  if (failed) value = 'Not available';
  else if (count !== null) value = count.toLocaleString('en-GB');

  return (
    <section aria-labelledby="subscribers-title" className="subscriber-stat">
      <h2 id="subscribers-title" className="subscriber-stat-label">
        Subscribers
      </h2>
      <p className="subscriber-stat-value mb-0">{value}</p>
    </section>
  );
};

export default SubscriberCount;
