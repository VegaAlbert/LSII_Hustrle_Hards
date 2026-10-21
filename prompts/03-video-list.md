# Video list from the store (US-04)

**Approved on:** PENDING — proposed in the PR of branch `task/4-video-list`
**Approved by:** PENDING team review
**Used for:** implementing US-04 (browse video list) end to end: `Video` entity, import from the video store,
paginated API and home page grid

## Prompt

Implement US-04 (Browse video list) from `REQUIREMENT.md`, issue #4, following `AGENTS.md`, `backend/AGENTS.md` and
`frontend/AGENTS.md`. Work only on the branch `task/4-video-list`.

Context: the video store (`pro_tube.store.dir`) holds, for each video, `<id>.mp4`, `<id>.webp` (thumbnail) and
`<id>.json` with `id`, `width`, `height`, `duration` (seconds), `title`, `user`, `timestamp` (epoch seconds) and
`meta` (`description`, `categories`, `tags`, `view_count`, `like_count`, `channel`, `comments`...). `/media/**` already
serves the store files. `GET /api/videos` currently returns a hardcoded list and is public in `SecurityConfig`.

Backend:

* `Video` JPA entity in `domain/`: generated id, `storeId` (unique, the id of the json), `title`, `description`
  (long text), `author` (json `user`), `durationSeconds`, `width`, `height`, `publishedAt` (`Instant` from
  `timestamp`), `videoFile` and `thumbnailFile` (file names in the store). Keep it simple: tags, categories and
  comments are left for US-07 / US-09. `VideoRepository` in `repository/`.
* Import the store on startup from `AppStartupRunner` through a service (e.g. `VideoStoreImporter`): read every
  `*.json`, skip files whose `.mp4` or `.webp` is missing, skip videos already imported (idempotent, by `storeId`),
  log and skip invalid json without stopping the app. Keep `pro_tube.load_initial_data` as the switch, and make sure
  the videos are also imported in the Docker setup (`prod` profile in `compose.yaml`).
* `GET /api/videos?page=0&size=12` (public): newest first, returns a page DTO
  `{ content, page, size, totalElements, totalPages }` with `VideoSummaryResponse`
  `{ id, title, author, durationSeconds, thumbnailUrl }`, where `thumbnailUrl` is the path under `/media`
  (e.g. `/media/0.webp`). Validate `page >= 0` and `1 <= size <= 50` (400 otherwise). Never return the entity.
* Tests: importer with a `@TempDir` store (valid, missing files, invalid json, re-import), service unit tests with
  Mockito, endpoint test with MockMvc (pagination, order, 400 cases). Update the existing `VideosControllerTest`.

Frontend:

* Home page shows a responsive grid of `VideoCard` (thumbnail with `alt` = title, title, author, duration as `m:ss`),
  using `MEDIA_BASE_URL` for the thumbnail and `API_BASE_URL` for the API (`src/utils/Env.ts`).
* "Load more" button that fetches the next page and appends it; hidden when there are no more pages. Loading, empty
  and error states with a retry button.
* Replace the hardcoded list in `App.tsx` / `useAllVideos.ts` and the placeholder `VideoGrid`; keep the login and
  navbar working.
* Tests with Testing Library, querying by role/label; mock the API module; use `@testing-library/user-event` (add it
  as a dev dependency). Cover loading, list, load more, empty and error.

Finally run `mvn clean verify -Pcoverage` in `backend/` and `npm run test`, `npm run lint`, `npm run build` in
`frontend/`, fix anything that fails, and summarise the changes so I can explain every part.

## Notes

* The `Video` entity defined here is also needed by US-05 (video player, Albert Mora): agree on it before both
  stories change it.
* The card does not link to a detail page yet: routing comes with US-05.
