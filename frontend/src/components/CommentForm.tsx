import { useId, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isUnauthorized, toApiError } from '../auth/authApi';
import { useAuth } from '../auth/authContext';
import { MAX_COMMENT_LENGTH, postComment, postReply, type VideoComment } from '../videos/videosApi';
import Avatar from './Avatar';

type Props = {
  videoId: number;
  // Receives the comment saved by the backend, to show it under the video
  onCommentAdded: (comment: VideoComment) => void;
  // US-10: with a comment id, the form posts a reply to that comment
  parentId?: number;
  // US-10: called by "Cancel" in a reply form, to close it
  onCancel?: () => void;
};

/**
 * US-09: form to comment on a video. Visitors who are not logged in are asked to log in instead, and come back to the
 * video afterwards. US-10: with `parentId` it is the form to reply to that comment.
 */
const CommentForm = ({ videoId, onCommentAdded, parentId, onCancel }: Props) => {
  const { user } = useAuth();
  const location = useLocation();
  const isReply = parentId !== undefined;
  const textareaId = useId();
  const label = isReply ? 'Add a reply' : 'Add a comment';
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
      const trimmed = text.trim();
      onCommentAdded(isReply ? await postReply(videoId, parentId, trimmed) : await postComment(videoId, trimmed));
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
    <form className={isReply ? 'comment-form is-reply' : 'comment-form'} onSubmit={handleSubmit}>
      <Avatar name={user.username} size="sm" />
      <div className="flex-grow-1 min-w-0">
        <label htmlFor={textareaId} className="visually-hidden">
          {label}
        </label>
        <textarea
          id={textareaId}
          className="form-control"
          rows={2}
          placeholder={`${label}...`}
          // A reply form is opened on purpose, so the user can type right away
          autoFocus={isReply}
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
            to {isReply ? 'reply' : 'comment'}.
          </p>
        )}
        <div className="comment-form-actions">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              setText('');
              onCancel?.();
            }}
            // A reply form can always be closed; the comment form only clears its text
            disabled={submitting || (!isReply && text.length === 0)}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!canSubmit}>
            {isReply ? (submitting ? 'Replying...' : 'Reply') : submitting ? 'Commenting...' : 'Comment'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
