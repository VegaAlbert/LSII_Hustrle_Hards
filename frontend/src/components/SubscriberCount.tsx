import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/i18nContext';
import { fetchSubscriberCount } from '../subscriptions/subscriptionsApi';

/**
 * US-13: number of users subscribed to the channel of the logged-in user, as one more card of the totals on the
 * Analytics page (it renders an `<li>`, so it goes inside that list).
 */
const SubscriberCount = () => {
  const { t, language } = useTranslation();
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

  let value = t('video.subscribersLoading');
  if (failed) value = t('video.notAvailable');
  else if (count !== null) value = new Intl.NumberFormat(language).format(count);

  return (
    <li className="analytics-card">
      <span className="analytics-card-label">{t('video.subscribersTitle')}</span>
      <strong className="analytics-card-value">{value}</strong>
    </li>
  );
};

export default SubscriberCount;
