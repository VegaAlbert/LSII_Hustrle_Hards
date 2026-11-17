import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isUnauthorized } from '../auth/authApi';
import { useAuth } from '../auth/authContext';
import {
  fetchSubscription,
  formatSubscribers,
  setSubscription,
  type SubscriptionState,
} from '../subscriptions/subscriptionsApi';

type Props = {
  // Username of the user who uploaded the video
  channel: string;
};

/**
 * US-13: number of subscribers of a channel and a toggle to subscribe to it or unsubscribe. Users do not get the
 * toggle on their own channel; visitors who are not logged in are sent to the login page and come back here.
 */
const SubscribeButton = ({ channel }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<SubscriptionState | null>(null);
  // True while the state is being read or changed
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ownChannel = user?.username === channel;

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    fetchSubscription(channel)
      .then((result) => {
        if (!cancelled) setState(result);
      })
      // Not knowing the state is not worth an error: the button just starts as "not subscribed"
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // Read again when logging in or out: the "subscribed" part depends on the user
  }, [channel, user]);

  const subscribed = Boolean(user) && Boolean(state?.subscribed);

  const toggle = async () => {
    if (!user) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setState(await setSubscription(channel, !subscribed));
    } catch (err: unknown) {
      setError(
        isUnauthorized(err)
          ? 'Your session has expired. Log in again to subscribe.'
          : 'Could not update your subscription.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="subscribe-box">
      {state && <span className="subscriber-count">{formatSubscribers(state.subscribers)}</span>}
      {!ownChannel && (
        <button
          type="button"
          // Not subscribed yet: the call to action uses the primary button of the design system
          className={subscribed ? 'pill-btn subscribe-btn' : 'btn btn-primary btn-sm rounded-pill px-3 subscribe-btn'}
          aria-pressed={subscribed}
          onClick={toggle}
          disabled={busy}
        >
          {subscribed ? 'Subscribed' : 'Subscribe'}
        </button>
      )}
      {error && (
        <p role="alert" className="text-danger small mb-0 w-100">
          {error}
        </p>
      )}
    </div>
  );
};

export default SubscribeButton;
