import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isUnauthorized } from '../auth/authApi';
import { useAuth } from '../auth/authContext';
import { formatRelativeTime } from '../utils/relativeTime';
import { setCommentLike, type CommentLike, type VideoComment } from '../videos/videosApi';
import Avatar from './Avatar';
import CommentForm from './CommentForm';

type Props = {
  videoId: number;
  comment: VideoComment;
  // Receives the reply saved by the backend and the id of the comment it answers
  onReplyAdded: (parentId: number, reply: VideoComment) => void;
  // Receives the new like state of a comment or of one of its replies
  onLikeChanged: (commentId: number, like: CommentLike) => void;
  // Replies cannot be answered themselves: there is only one level
  isReply?: boolean;
};

const ThumbIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8.86 1.1a1 1 0 0 0-1.7.33L6.1 4.9 4 7v7h7.6a1.5 1.5 0 0 0 1.47-1.2l.9-4.5A1.5 1.5 0 0 0 12.5 6.5H9.6l.6-2.7a2 2 0 0 0-.53-1.86zM1 7h2v7H1z" />
  </svg>
);

/**
 * One comment of a video (US-05) with its like button and, for top-level comments, the reply button and its replies
 * nested below (US-10). Visitors who are not logged in are sent to the login page and come back to the video.
 */
const CommentItem = ({ videoId, comment, onReplyAdded, onLikeChanged, isReply = false }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [replying, setReplying] = useState(false);
  const [liking, setLiking] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);

  const goToLogin = () => navigate('/login', { state: { from: `${location.pathname}${location.search}` } });

  const toggleLike = async () => {
    if (!user) {
      goToLogin();
      return;
    }
    setLiking(true);
    setLikeError(null);
    try {
      onLikeChanged(comment.id, await setCommentLike(videoId, comment.id, !comment.likedByMe));
    } catch (err: unknown) {
      setLikeError(
        isUnauthorized(err) ? 'Your session has expired. Log in again to like.' : 'Could not update the like.'
      );
    } finally {
      setLiking(false);
    }
  };

  const openReplyForm = () => {
    if (!user) {
      goToLogin();
      return;
    }
    setReplying(true);
  };

  const likesLabel = `${comment.likeCount} ${comment.likeCount === 1 ? 'like' : 'likes'}`;

  return (
    <li className={isReply ? 'comment is-reply' : 'comment'}>
      <Avatar name={comment.author} size="sm" />
      <div className="flex-grow-1 min-w-0">
        <p className="comment-header mb-1">
          <span className="comment-author">@{comment.author}</span>
          {comment.publishedAt && (
            <time className="comment-time" dateTime={comment.publishedAt}>
              {formatRelativeTime(comment.publishedAt)}
            </time>
          )}
        </p>
        {/* dir="auto" aligns right-to-left languages (e.g. Arabic) correctly */}
        <p className="comment-text mb-2" dir="auto">
          {comment.text}
        </p>

        <div className="comment-actions">
          <button
            type="button"
            className={comment.likedByMe ? 'comment-like is-liked' : 'comment-like'}
            aria-pressed={comment.likedByMe}
            aria-label={`Like comment by @${comment.author}, ${likesLabel}`}
            onClick={toggleLike}
            disabled={liking}
          >
            <ThumbIcon />
            <span aria-hidden="true">{comment.likeCount}</span>
          </button>
          {!isReply && (
            <button
              type="button"
              className="comment-reply-button"
              aria-label={`Reply to @${comment.author}`}
              onClick={openReplyForm}
              aria-expanded={replying}
            >
              Reply
            </button>
          )}
        </div>
        {likeError && (
          <p role="alert" className="text-danger small mt-2 mb-0">
            {likeError}
          </p>
        )}

        {replying && (
          <div className="mt-3">
            <CommentForm
              videoId={videoId}
              parentId={comment.id}
              onCommentAdded={(reply) => {
                onReplyAdded(comment.id, reply);
                setReplying(false);
              }}
              onCancel={() => setReplying(false)}
            />
          </div>
        )}

        {comment.replies.length > 0 && (
          <ul aria-label={`Replies to @${comment.author}`} className="comment-replies list-unstyled mb-0">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                videoId={videoId}
                comment={reply}
                onReplyAdded={onReplyAdded}
                onLikeChanged={onLikeChanged}
                isReply
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
};

export default CommentItem;
