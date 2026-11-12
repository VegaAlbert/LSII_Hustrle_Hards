# Comment on a video (US-09)

**Approved on:** PENDING — proposed in the PR of branch `task/9-video-comments`
**Approved by:** PENDING team review
**Used for:** implementing US-09 (comment on a video) end to end: create-comment endpoint, comment form on the video
detail page, login prompt for anonymous visitors

## Prompt

Implement US-09 (Comment on a video) from `REQUIREMENT.md`, issue #9, following `AGENTS.md`, `backend/AGENTS.md`,
`frontend/AGENTS.md` and the `create-rest-endpoint` skill. Work only on the branch `task/9-video-comments`, created
from an up-to-date `develop`.

Context: US-05 already provides the `Comment` entity (`author`, `text`, `likeCount`, `publishedAt`, many-to-one
`video`), `Video.addComment`, `CommentResponse` and `GET /api/videos/{id}` returning the comments newest first. The
detail page renders a read-only `CommentList`. Authentication is a JWT sent by `AuthProvider` in the axios default
`Authorization` header; `useAuth()` gives the logged-in user; the login route goes back to `state.from`.

Backend:

* New `POST /api/videos/{id}/comments` with a JSON body `CreateCommentRequest(text)`: `@NotBlank` ("Comment is
  required") and at most 1000 characters. Only for logged-in users (protect it in `SecurityConfig`).
* The logic lives in a new `CommentService.addComment(videoId, username, text)`: the author is the username of the
  token, the date is now, the text is trimmed, `likeCount` starts at 0. It is persisted through a new
  `CommentRepository` after `video.addComment(comment)`. The controller only delegates.
* Answers 201 with the `CommentResponse` (no `Location` header: comments have no route of their own), 400 with a
  field error for a blank or too long text, 401 without a valid token or if the user of the token no longer exists, 404 if the video does not exist.
* Tests: service unit tests with Mockito (saved fields, trimming, unknown video, unknown user) and endpoint tests with
  MockMvc on the in-memory database (201 and visible in `GET /api/videos/{id}` first, 400 blank, 400 too long,
  401, 404).

Frontend:

* `postComment(videoId, text)` in `src/videos/videosApi.ts`.
* `useVideoDetail` exposes `addComment(comment)` that puts the new comment first without reloading the video.
* New `CommentForm` component rendered by the detail page at the top of the comments section (`CommentList` gets an
  optional `form` slot):
  * Logged in: a controlled textarea labelled "Add a comment", a "Comment" button disabled while the trimmed text
    is empty or while sending, a "Cancel" button that clears it, the same 1000-character limit, the error of the
    backend in a `role="alert"` and, on 401, a link to log in again.
  * Not logged in: a "Log in to comment" prompt with a link to `/login` that comes back to the video
    (`state.from`).
* Tests with Testing Library and `user-event`, mocking the API module: `CommentForm` (anonymous prompt, disabled
  button, submit trims and clears, error, cancel), `CommentList` with the form slot and the detail page flow (the
  new comment appears first and the count increases).

Finally run `mvn clean verify -Pcoverage` in `backend/` and `npm run test`, `npm run lint`, `npm run build` in
`frontend/`, fix anything that fails, and summarise the changes so I can explain every part.

## Notes

* Replies and likes are US-10, so the like count of a new comment is always 0 and there is no like button.
* The comment stores the author's username as text (as imported comments do), not a relation to `User`.
