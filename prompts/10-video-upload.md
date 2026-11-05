# Upload a video (US-06)

**Approved on:** PENDING — proposed in the PR of branch `task/6-upload-video`
**Approved by:** PENDING team review
**Used for:** a full-stack user story that adds a multipart upload endpoint, a multi-field form and new fields shown
on an existing page

## Prompt

Implement US-06 "Upload a video" (issue #6) following `AGENTS.md`, `backend/AGENTS.md`, `frontend/AGENTS.md`,
`docs/DESIGN_SYSTEM.md` and the `create-rest-endpoint` skill. Make it as complete as a video platform like YouTube,
keeping the existing style. Work on the branch `task/6-upload-video`, created from an up-to-date `develop`.

Backend:

* `Video` gets `tags` (ordered element collection), `category` (enum `VideoCategory` with the YouTube categories),
  `ageRestricted` (column with a default so `ddl-auto` can add it to a table that already has videos) and the
  `uploader` (`User`, null for videos imported from the store, needed later by US-07).
* `POST /api/videos`, only for logged-in users (`SecurityConfig`): multipart request with a `metadata` JSON part
  (`UploadVideoRequest`, validated: title required up to 100 characters, description up to 5000, at most 15 tags of
  30 characters, duration and size read by the browser) and the `video` and `thumbnail` files. Answer 201 with the
  new `VideoDetailResponse` and a `Location` header.
* `VideoUploadService`: accept MP4/WebM videos and JPG/PNG/WebP thumbnails up to 2 MB, store them in
  `pro_tube.store.dir` with a unique name, date the video now and normalise the tags (trim, no leading `#`, no
  repeats ignoring case). If any step fails, delete the files already written so no partial video is published.
* Errors in `ApiExceptionHandler`: invalid or missing files → 400 with the field, files too big → 413, storage
  failure → 500. Raise `max-request-size` (and nginx `client_max_body_size`) so a 100 MB video fits with its
  thumbnail.
* Add `tags`, `category` and `ageRestricted` to the detail response and `ageRestricted` to the list.
* Tests: Mockito unit tests of the service with a `@TempDir` store (happy path, each rejected file, user not found,
  files deleted when saving fails) and `@SpringBootTest` endpoint tests with a temporary store (201, 401, 400s).

Frontend:

* `/upload` page, sending anonymous visitors to the login page and back afterwards (`state.from`). First a drop
  zone (drag and drop or "Select file", checked type and size), then a two-column form: title with counter
  (suggested from the file name), description with counter and a preview of its #hashtags, thumbnail chosen among
  three frames taken from the video in the browser (canvas) or a custom image, tags as chips (Enter or comma, paste
  of a comma list, Backspace removes the last), category, age restriction; on the right the video preview with name,
  size, duration and resolution. Upload with axios and a progress bar, then open the new video page; show the
  server field errors and a message when the session has expired.
* "Create" button in the navbar.
* Video page: the first three hashtags above the title, hashtags in the description as links to a search, tags as
  chips linking to a search, category, the date with the relative time and the full date as tooltip, a "Share"
  dialog (WhatsApp, X, Facebook, Reddit, email, copy link, optional "Start at" the current second) and `?t=`
  links that start the video at that second. Age-restricted videos are covered by a gate: log in first, then
  confirm being over 18. Cards of age-restricted videos get an 18+ badge and no hover preview.
* Colours only through `--pt-*` tokens (third-party brand colours of the share buttons as tokens in `theme.css`).
* Tests with Testing Library and `user-event` for the page, the tag input, the share dialog, the new detail page
  features, the API call (FormData and progress) and the helpers; mock the API module and the frame extraction.

## Notes

* The frames are taken in the browser, so no ffmpeg is needed in the backend; `readVideoFile` only runs in a real
  browser (jsdom cannot play videos) and is mocked in tests.
* In the `dev` profile (in-memory H2) uploaded videos disappear from the catalog on restart, although their files
  stay in the store. With Docker (PostgreSQL) they are kept.
* Editing the metadata of an uploaded video is US-07.
