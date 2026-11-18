import { useEffect, useState } from 'react';
import { fetchSubscriberCount } from '../subscriptions/subscriptionsApi';

const numberFormat = new Intl.NumberFormat('en-GB');

/**
 * US-13: number of users subscribed to the channel of the logged-in user, as one more card of the totals on the
 * Analytics page (it renders an `<li>`, so it goes inside that list).
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

  let value = '…';
  if (failed) value = 'Not available';
  else if (count !== null) value = numberFormat.format(count);

  return (
    <li className="analytics-card">
      <span className="analytics-card-label">Subscribers</span>
      <strong className="analytics-card-value">{value}</strong>
    </li>
  );
};

export default SubscriberCount;
