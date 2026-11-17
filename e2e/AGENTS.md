# E2E rules (Playwright)

Applies to everything under `e2e/`. Root rules: [../AGENTS.md](../AGENTS.md). Covers NFR-02 of
[REQUIREMENT.md](../REQUIREMENT.md): golden paths of the MVP run in a real browser against the real backend and
frontend.

## How it runs

* `npm test` starts both apps through `webServer` in `playwright.config.ts`, on their own ports (backend `8081`,
  frontend `5174`) so they never clash with the dev servers:
  * `scripts/start-backend.mjs` recreates `e2e/.store/` (gitignored) from `fixtures/store/` and runs
    `mvn spring-boot:run` with the `dev` profile: empty in-memory H2 plus the fixture videos. Every run is a fresh
    environment.
  * The frontend runs `npm run dev` with `VITE_API_DOMAIN`/`VITE_MEDIA_DOMAIN` pointing to that backend and the
    Google button hidden.
* Outside CI, already running servers on those ports are reused (`reuseExistingServer`); stop them to get a fresh
  database.
* Ports and Maven command can be changed with `E2E_BACKEND_PORT`, `E2E_FRONTEND_PORT` and `E2E_MAVEN`. URLs are read
  from `env.ts`, never hardcoded in a spec.

## Writing tests

* One spec per feature in `tests/` (`auth`, `videos`, `upload`, `comments`...). Each new or changed user story adds or
  updates the golden path of its feature here, plus its most important error case.
* Test like a user: locators by role, label or text (`getByRole` → `getByLabel` → `getByText`), the same accessible
  names as the frontend tests. No CSS selectors or `data-testid` unless there is no alternative.
* Never wait with fixed timeouts (`waitForTimeout`): use web-first assertions (`expect(...).toBeVisible()`,
  `expect.poll`).
* Tests are independent and run in parallel against one backend: each test creates its own user with `newUser()` /
  `loginAsNewUser()` from `tests/support.ts` and unique titles or texts (e.g. with `Date.now()`). Never depend on
  data created by another test or on the order of the tests.
* Log in through the UI only in the authentication tests; other tests use `loginAsNewUser()` (API + stored session).
* Reusable steps (search and open a video, check a video plays...) go in `tests/support.ts`.
* Fixture media lives in `fixtures/`. Videos are **VP9 in MP4** (Playwright's Chromium cannot decode H.264), small
  (a few KB), and the store ones need their `.json` and `.webp` like the video grabber output.
* A test must fail if its flow breaks: check the visible outcome (the new comment is listed, the video's time moves
  forward), not only that a button was clicked.

## Commands

* `npm ci && npx playwright install --with-deps chromium` once (also needs Java 21 and Maven, and `npm ci` in
  `frontend/`).
* `npm test` · one file: `npx playwright test tests/comments.spec.ts` · debug: `npm run test:ui` / `npm run test:headed`
* `npm run typecheck` before pushing; `npm run report` opens the last HTML report (traces of failed tests).
