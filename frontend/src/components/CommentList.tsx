import { formatRelativeTime } from '../utils/relativeTime';
import type { VideoComment } from '../videos/videosApi';
import Avatar from './Avatar';

type Props = {
  comments: VideoComment[];
};

const ThumbIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8.86 1.1a1 1 0 0 0-1.7.33L6.1 4.9 4 7v7h7.6a1.5 1.5 0 0 0 1.47-1.2l.9-4.5A1.5 1.5 0 0 0 12.5 6.5H9.6l.6-2.7a2 2 0 0 0-.53-1.86zM1 7h2v7H1z" />
  </svg>
);

/**
 * Read-only list of the comments of a video (US-05). Writing comments comes with US-09.
 */
const CommentList = ({ comments }: Props) => (
  <section aria-labelledby="comments-title" className="comments mt-4">
    <h2 id="comments-title" className="section-title">
      Comments <span className="count-pill">{comments.length}</span>
    </h2>

    {comments.length === 0 ? (
      <p className="comments-empty">No comments yet.</p>
    ) : (
      <ul aria-label="Comments" className="list-unstyled d-flex flex-column gap-3 mb-0">
        {comments.map((comment) => (
          <li key={comment.id} className="comment">
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
              <span
                className="comment-likes"
                aria-label={`${comment.likeCount} ${comment.likeCount === 1 ? 'like' : 'likes'}`}
              >
                <ThumbIcon />
                <span aria-hidden="true">{comment.likeCount}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default CommentList;
