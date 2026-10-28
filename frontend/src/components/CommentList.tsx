import type { VideoComment } from '../videos/videosApi';

type Props = {
  comments: VideoComment[];
};

/**
 * Read-only list of the comments of a video (US-05). Writing comments comes with US-09.
 */
const CommentList = ({ comments }: Props) => (
  <section aria-labelledby="comments-title" className="mt-4">
    <h2 id="comments-title" className="h5">
      Comments ({comments.length})
    </h2>

    {comments.length === 0 ? (
      <p className="text-muted">No comments yet.</p>
    ) : (
      <ul aria-label="Comments" className="list-unstyled">
        {comments.map((comment) => (
          <li key={comment.id} className="border-bottom py-2">
            <p className="fw-bold small mb-1">{comment.author}</p>
            <p className="mb-1 comment-text">{comment.text}</p>
            <p className="text-muted small mb-0">
              {comment.likeCount} {comment.likeCount === 1 ? 'like' : 'likes'}
            </p>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default CommentList;
