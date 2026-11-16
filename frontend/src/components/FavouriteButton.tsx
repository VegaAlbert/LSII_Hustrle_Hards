import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isUnauthorized } from '../auth/authApi';
import { useAuth } from '../auth/authContext';
import { fetchFavouriteState, setFavourite } from '../favourites/favouritesApi';

type Props = {
  videoId: number;
};

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
    />
  </svg>
);

/**
 * US-12: toggle to save the video as favourite or remove it. The saved state is read from the backend for logged-in
 * users; visitors who are not logged in are sent to the login page and come back to the video.
 */
const FavouriteButton = ({ videoId }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [favourite, setFavouriteState] = useState(false);
  // True while the state is being read or changed
  const [busy, setBusy] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      // Logged out while on the page: nothing is saved for a visitor
      setFavouriteState(false);
      setBusy(false);
      return;
    }
    let cancelled = false;
    setBusy(true);
    fetchFavouriteState(videoId)
      .then((state) => {
        if (!cancelled) setFavouriteState(state.favourite);
      })
      // Not knowing the state is not worth an error: the button just starts as "not saved"
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, videoId]);

  const toggle = async () => {
    if (!user) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const state = await setFavourite(videoId, !favourite);
      setFavouriteState(state.favourite);
    } catch (err: unknown) {
      setError(
        isUnauthorized(err)
          ? 'Your session has expired. Log in again to save favourites.'
          : 'Could not update your favourites.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={favourite ? 'pill-btn favourite-btn is-favourite' : 'pill-btn favourite-btn'}
        aria-pressed={favourite}
        onClick={toggle}
        disabled={busy}
      >
        <HeartIcon filled={favourite} />
        {favourite ? 'Saved' : 'Save to favourites'}
      </button>
      {error && (
        <p role="alert" className="text-danger small mb-0 w-100 text-end">
          {error}
        </p>
      )}
    </>
  );
};

export default FavouriteButton;
