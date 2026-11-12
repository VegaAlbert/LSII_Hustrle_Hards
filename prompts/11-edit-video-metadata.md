# Edit video metadata (US-07)

**Approved on:** PENDING — proposed in the PR of branch `task/7-edit-video-metadata`
**Approved by:** PENDING team review
**Used for:** letting the owner of a resource edit it: an update endpoint with an ownership check, and an edit page
that reuses the form of the create page

## Prompt

Implement US-07 "Edit video metadata" (issue #7) following `AGENTS.md`, `backend/AGENTS.md`, `frontend/AGENTS.md`,
`docs/DESIGN_SYSTEM.md` and the `create-rest-endpoint` skill. Work on the branch `task/7-edit-video-metadata`,
created from an up-to-date `develop`. US-06 already stores the `uploader` of each video.

Backend:

* `PUT /api/videos/{id}`, only for logged-in users (`SecurityConfig`), with an `UpdateVideoRequest` body (title,
  description, tags, category, age restriction) validated with the same rules as `UploadVideoRequest`. Every field
  is replaced; the video file, duration and date cannot change.
* `VideoService.updateVideo`: 404 if the video does not exist, `VideoAccessDeniedException` → 403 if the logged-in
  user is not its uploader (imported videos have no uploader, so nobody can edit them). Reuse the tag normalisation
  of the upload (move it to a shared `VideoTags` helper).
* Add `uploader` (username or null) to `VideoDetailResponse`, so the frontend knows who can edit.
* Allow `PUT` in the CORS mapping of `/api/**` (Spring only allows GET, HEAD and POST by default, which breaks the
  dev frontend on port 5173).
* Tests: Mockito unit tests of the service (owner, other user, imported video, not found, blank description) and
  `@SpringBootTest` endpoint tests (200 and the change visible in `GET`, 403, 401, 400, 404, CORS preflight).

Frontend:

* Extract the title, description (with #hashtags preview), tags, category and age restriction fields of the upload
  page into a shared `VideoMetadataFields` component, with the validation in `videos/videoMetadata.ts`, and use it
  in the upload page without changing its behaviour or tests.
* `/videos/:id/edit` page: login redirect for anonymous visitors, loading, error with retry and not-found states,
  a "You can only edit your own videos" message for other users, and the form filled with the current values. The
  right column shows the thumbnail, the link, the date and the duration. "Save" is disabled until something
  changes; after saving go back to the video page. Show server errors and a message when the session expired.
* "Edit video" button on the video page, only for its uploader.
* Tests with Testing Library and `user-event` for the edit page, the button and the API call.

## Notes

* Changing the thumbnail or the video file and deleting a video are not part of US-07.
