# Video player and detail page (US-05)

**Approved on:** PENDING — proposed in the PR of branch `task/5-video-player`
**Approved by:** PENDING team review
**Used for:** implementing US-05 (play a video and view its details) end to end: detail endpoint, comments imported
from the store, routing and the video page

## Prompt

Implement US-05 (Play a video and view its details) from `REQUIREMENT.md`, issue #5, following `AGENTS.md`,
`backend/AGENTS.md` and `frontend/AGENTS.md`, on top of US-04 (`Video` entity, `VideoStoreImporter`, video grid).
Work only on the branch `task/5-video-player`.

Backend:

* `Comment` entity in `domain/` (author, text, likeCount, publishedAt) linked to `Video` with a `@OneToMany` that
  cascades and is ordered newest first. US-05 only reads comments; US-09 will add new ones.
* `VideoStoreImporter` also imports `meta.comments` of each json (`text`, `author`, `timestamp`, `like_count`),
  skipping comments without text or author.
* `GET /api/videos/{id}` (public) returns a `VideoDetailResponse` (title, description, author, duration, size,
  publishedAt, `videoUrl` and `thumbnailUrl` under `/media`, comments as `CommentResponse`). 404 with
  `VideoNotFoundException` mapped in `ApiExceptionHandler`; 400 for a non-numeric id. Never return entities.
* Tests: importer (comments), service (found / not found) and MockMvc (detail, comment order, 404, 400).

Frontend:

* Add `react-router-dom` as in the "React and how to test it" session: `Layout` (navbar + `Outlet`) and routes `/`
  (video grid), `/login`, `/videos/:id` and `*` (not found). Keep the routes in an exported `AppRoutes` so tests can
  use a `MemoryRouter`. Pages in `src/pages/`.
* Each `VideoCard` links to `/videos/:id`.
* `VideoDetailPage`: `<video controls autoPlay>` with the media URL and the thumbnail as poster, title, author, date,
  description and the list of comments. Loading state, error with retry, and a "Video not found" state (404 or an
  invalid id) instead of a broken player.
* Tests with Testing Library and user-event, mocking the API module: detail, not found, invalid id, error + retry,
  comment list, navigation from the grid to the video and unknown routes.

Finally run `mvn clean verify -Pcoverage` in `backend/` and `npm run test`, `npm run lint`, `npm run build` in
`frontend/`, fix anything that fails, and summarise the changes so I can explain every part.

## Notes

* The `Comment` entity is shared with US-09 / US-10 (Victor): build on it instead of creating another one.
* Databases that already imported the videos (e.g. the Docker volume) do not get the comments, because the import
  skips existing videos: run `docker compose down -v` once to import everything again.
