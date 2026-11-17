import type { ReactNode } from 'react';
import type { CommentLike, VideoComment } from '../videos/videosApi';
import CommentItem from './CommentItem';

type Props = {
  videoId: number;
  // Top-level comments, each with its replies
  comments: VideoComment[];
  // Shown above the list, e.g. the form to add a comment (US-09)
  form?: ReactNode;
  // US-10: a reply was published or a like changed
  onReplyAdded: (parentId: number, reply: VideoComment) => void;
  onLikeChanged: (commentId: number, like: CommentLike) => void;
};

/**
 * List of the comments of a video, newest first (US-05), with an optional form slot above it (US-09) and the replies
 * nested under each comment (US-10). The count includes the replies.
 */
const CommentList = ({ videoId, comments, form, onReplyAdded, onLikeChanged }: Props) => {
  const total = comments.reduce((count, comment) => count + 1 + comment.replies.length, 0);

  return (
    <section aria-labelledby="comments-title" className="comments mt-4">
      <h2 id="comments-title" className="section-title">
        Comments <span className="count-pill">{total}</span>
      </h2>

      {form}

      {comments.length === 0 ? (
        <p className="comments-empty">No comments yet.</p>
      ) : (
        <ul aria-label="Comments" className="list-unstyled d-flex flex-column gap-3 mb-0">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              videoId={videoId}
              comment={comment}
              onReplyAdded={onReplyAdded}
              onLikeChanged={onLikeChanged}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export default CommentList;
