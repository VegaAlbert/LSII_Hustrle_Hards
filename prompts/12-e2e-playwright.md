# E2E tests with Playwright (NFR-02)

**Approved on:** PENDING — proposed in the PR of branch `E2E-Tests-Playwright`
**Approved by:** PENDING team review
**Used for:** setting up the Playwright E2E suite and adding E2E tests for new or changed user-facing features

## Prompt

Implement the E2E tests with Playwright for NFR-02 of `REQUIREMENT.md`, following `AGENTS.md` and
`frontend/AGENTS.md` ("E2E tests will live in their own folder with their own runner").

* New folder `e2e/` at the repo root with its own `package.json` (`@playwright/test`, TypeScript), separate from the
  frontend Jest tests.
* Fresh environment on every run: Playwright's `webServer` starts the backend (`mvn spring-boot:run`, `dev` profile
  with in-memory H2) and the frontend (`npm run dev`) on their own ports (8081 / 5174) so they do not clash with the
  dev servers. The backend uses a video store recreated from committed fixtures (`e2e/fixtures/store/`, `.json` +
  `.mp4` + `.webp` like the video grabber) in a gitignored folder, because uploads write to it. The frontend gets the
  backend URL through `VITE_API_DOMAIN` / `VITE_MEDIA_DOMAIN` and the Google button is hidden.
* Fixture videos encoded as VP9 in MP4 and only a few KB, since Playwright's Chromium cannot decode H.264.
* Golden paths, one spec per feature: authentication (register, logout, login, wrong password, duplicated user,
  upload needs login), videos (list, search with URL and back button, suggestions, no results, playback checking the
  current time moves forward, not found), upload (choose a file, frames as thumbnails, publish, plays, found by
  search; non-video file rejected) and comments (logged-in comment shown first and persisted after reload; anonymous
  visitor logs in from the video and comes back).
* Locators by role and label, web-first assertions, no fixed waits. Tests independent and parallel: each one creates
  its own user (through the API, except in the auth tests) and unique data. Shared steps in `tests/support.ts`.
* Add an `e2e` job to `.github/workflows/main.yml` that uploads the Playwright report, and document the commands in
  `DEVELOPMENT.md` and the rules in `e2e/AGENTS.md`.
* Update `AGENTS.md` (Definition of Done), `frontend/AGENTS.md`, the reviewer agent and the `create-rest-endpoint`
  skill so every new feature also adds or updates its E2E tests.

Finally run the suite, check it fails when a covered flow is broken on purpose, and summarise the changes so I can
explain every part.

## Reusing it for a new feature

> Add the E2E golden path of US-XX (<feature>) to `e2e/tests/<feature>.spec.ts` following `e2e/AGENTS.md`: the
> happy path a user follows on screen and its main error case, reusing the helpers of `tests/support.ts`. Run
> `npm run typecheck` and `npm test` in `e2e/`.

## Notes

* Only Chromium is used to keep CI fast; Firefox/WebKit can be added as extra `projects`.
* Outside CI, `reuseExistingServer` reuses servers already on 8081/5174: stop them for a clean database.
