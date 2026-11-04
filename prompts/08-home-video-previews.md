# Home page with video previews (US-04)

**Approved on:** PENDING — proposed in the PR of branch `feature/home-video-previews`
**Approved by:** PENDING team review
**Used for:** redesigning the home video grid in the style of a video platform: card layout, hover preview,
loading placeholders

## Prompt

Redesign the home page video grid (US-04) so it feels like a modern video platform, following `AGENTS.md`,
`backend/AGENTS.md`, `frontend/AGENTS.md` and `docs/DESIGN_SYSTEM.md`. Work on the branch
`feature/home-video-previews`, created from `feature/style-guide` because it needs its design tokens.

Backend:

* Add `videoUrl` (path under `/media`) and `publishedAt` to `VideoSummaryResponse`, so the list can play a preview
  and show the date without one request per video. Update the service and endpoint tests.

Frontend:

* `VideoCard` without the Bootstrap card box: 16:9 thumbnail with `--pt-radius-lg`, duration badge, and below it the
  author avatar (existing `Avatar`), the title (two lines max, red on hover), the author and the relative date
  (existing `formatRelativeTime`). The whole card stays one link to the video page.
* Hover preview: after hovering the card for 500 ms (or focusing its link with the keyboard), play the video muted
  and in a loop over the thumbnail, with a thin red progress bar at the bottom. Stop it and go back to the thumbnail
  when the mouse leaves or the focus moves. No preview when the user prefers reduced motion. The video is only
  created while previewing, so the grid does not download every video.
* `VideoGrid`: responsive columns (1 / 2 / 3 / 4), and pulsing placeholder cards while the first page loads, keeping
  the existing `role="status"` loading message for screen readers.
* Tests with Testing Library and `user-event` (fake timers for the delay): preview after the delay, no preview when
  leaving before it, stop on leave, keyboard focus, reduced motion; update the fixtures with the new fields.

## Notes

* Inspired by the layout of common video platforms, but with ProTube's own design system; it is not a copy of any
  of them.
* Out of scope: category chips, infinite scroll, a sidebar and view counts (no backend support or user story yet).
