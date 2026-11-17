# Reply to and like comments (US-10)

**Approved on:** PENDING — proposed in the PR of branch `task/10-comment-replies-likes`
**Approved by:** PENDING team review
**Used for:** implementing US-10 (reply to and like comments) end to end: reply and like endpoints, nested replies
and like buttons on the video detail page

## Prompt

Implement US-10 (Reply to and like comments) from `REQUIREMENT.md`, issue #10, following `AGENTS.md`,
`backend/AGENTS.md`, `frontend/AGENTS.md` and the `create-rest-endpoint` skill. Work only on the branch
`task/10-comment-replies-likes`, created from an up-to-date `develop`.

Context: US-09 already provides `POST /api/videos/{id}/comments`, `CommentService.addComment`, `CommentRepository`,
`CreateCommentRequest` (1000 characters max) and the `CommentForm` component. `Comment` stores the author's username
as text and a `likeCount` (imported comments keep the count of the video store). `GET /api/videos/{id}` returns the
comments newest first. The JWT filter also authenticates public routes when a valid token is sent.

Backend:

* Replies: `Comment` gets an optional `parent` and its `replies` (oldest first). A reply also belongs to the video,
  so it is saved and deleted with it. Only one level of nesting: replying to a reply attaches the new reply to the
  top-level comment. `GET /api/videos/{id}` returns only the top-level comments, each with its `replies`.
* `POST /api/videos/{videoId}/comments/{commentId}/replies` with the same `CreateCommentRequest` body. 201 with the
  `CommentResponse`, 400 for a blank or too long text, 401 without a valid token or for a user that no longer exists,
  404 if the video does not exist or the comment does not belong to it.
* Likes: new `CommentLike` entity (comment + user, unique pair) in a new `CommentLikeRepository`. The count is updated
  with an atomic `UPDATE` so two users liking at the same time never lose a like.
  * `PUT /api/videos/{videoId}/comments/{commentId}/like` likes, `DELETE` on the same path unlikes. Both are
  idempotent and answer 200 with `CommentLikeResponse(likeCount, liked)`; 401 and 404 as for replies.
* `CommentResponse` adds `likedByMe` (false for anonymous visitors) and `replies`. `VideoService.getVideo` receives the
  optional username of the viewer to compute `likedByMe` with one query.
* New `CommentNotFoundException` mapped to 404. Protect the new routes in `SecurityConfig`.
* Tests: service unit tests with Mockito (reply saved and nested, reply to a reply goes to the top-level comment,
  like/unlike idempotent, unknown video, comment of another video, unknown user) and endpoint tests with MockMvc on
  the in-memory database (201/400/401/404 for replies, like and unlike changing the count and `likedByMe` in
  `GET /api/videos/{id}`, 401, 404).

Frontend:

* `VideoComment` gets `likedByMe` and `replies`. `postReply(videoId, commentId, text)` and
  `setCommentLike(videoId, commentId, liked)` (PUT to like, DELETE to unlike) in `src/videos/videosApi.ts`.
* `useVideoDetail` exposes `addReply(parentId, reply)` (appended at the end of the replies, without reloading) and
  `updateLike(commentId, likeCount, liked)`.
* `CommentForm` gets an optional `parentId`: then it posts a reply, is labelled "Add a reply", its button says
  "Reply" and "Cancel" also closes it.
* New `CommentItem` component used by `CommentList` for comments and replies: a like button with `aria-pressed` and
  the count in its accessible name, a "Reply" button (only on top-level comments) that opens the reply form, and the
  replies nested in their own list. Anonymous visitors are sent to `/login` (coming back to the video) when they
  press like or reply. A failed like shows an error in a `role="alert"`. The heading counts comments and replies.
* Styles with the `--pt-*` tokens only.
* Tests with Testing Library and `user-event`, mocking the API module: `CommentItem` (like, unlike, error,
  anonymous, reply form open/cancel/submit), `CommentList` with nested replies, `CommentForm` in reply mode,
  `videosApi` new calls and the detail page flow (a reply appears nested and the like count changes).

Finally run `mvn clean verify -Pcoverage` in `backend/` and `npm run test`, `npm run lint`, `npm run build` in
`frontend/`, fix anything that fails, and summarise the changes so I can explain every part.

## Notes

* Imported comments keep their like count from the store; likes of ProTube users are added on top of it, so unlike
  never takes the count below 0.
* Deleting a comment or a video is not part of the MVP; likes are removed by the database (`ON DELETE CASCADE`) if a
  comment is ever deleted.
