import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isUnauthorized, toApiError } from '../auth/authApi';
import { useAuth } from '../auth/authContext';
import { MAX_COMMENT_LENGTH, postComment, type VideoComment } from '../videos/videosApi';
import Avatar from './Avatar';

type Props = {
  videoId: number;
  // Receives the comment saved by the backend, to show it under the video
  onCommentAdded: (comment: VideoComment) => void;
};

/**
 * US-09: form to comment on a video. Visitors who are not logged in are asked to log in instead, and come back to the
 * video afterwards.
 */
const CommentForm = ({ videoId, onCommentAdded }: Props) => {
  const { user } = useAuth();
  const location = useLocation();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The token was rejected (e.g. it expired): the user has to log in again
  const [sessionExpired, setSessionExpired] = useState(false);

  // Page to come back to after logging in
  const loginState = { from: `${location.pathname}${location.search}` };

  if (!user) {
    return (
      <div className="comment-login-prompt">
        <span>Log in to comment on this video.</span>
        <Link to="/login" state={loginState} className="btn btn-primary btn-sm">
          Log in to comment
        </Link>
      </div>
    );
  }

  const canSubmit = text.trim().length > 0 && !submitting;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setSessionExpired(false);
    try {
      onCommentAdded(await postComment(videoId, text.trim()));
      setText('');
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        setSessionExpired(true);
      } else {
        const apiError = toApiError(err);
        setError(apiError.fieldErrors.text ?? apiError.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <Avatar name={user.username} size="sm" />
      <div className="flex-grow-1 min-w-0">
        <label htmlFor="comment-text" className="visually-hidden">
          Add a comment
        </label>
        <textarea
          id="comment-text"
          className="form-control"
          rows={2}
          placeholder="Add a comment..."
          maxLength={MAX_COMMENT_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        {error && (
          <p role="alert" className="text-danger small mt-2 mb-0">
            {error}
          </p>
        )}
        {sessionExpired && (
          <p role="alert" className="text-danger small mt-2 mb-0">
            Your session has expired.{' '}
            <Link to="/login" state={loginState}>
              Log in again
            </Link>{' '}
            to comment.
          </p>
        )}
        <div className="comment-form-actions">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setText('')}
            disabled={submitting || text.length === 0}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!canSubmit}>
            {submitting ? 'Commenting...' : 'Comment'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
