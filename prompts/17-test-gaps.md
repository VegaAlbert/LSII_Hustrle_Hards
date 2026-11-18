# Fill the test gaps (E2E, unit and CI)

**Approved on:** PENDING — proposed in the PR of branch `feature/test-gaps`
**Approved by:** PENDING team review
**Used for:** finding and adding the end-to-end, unit and CI checks that are missing after several features were
merged. New E2E tests for a single feature keep using `prompts/12-e2e-playwright.md`.

## Prompt

From an up-to-date `develop`, on the branch `feature/test-gaps`, add the end-to-end, unit and CI tests that are
missing, following `AGENTS.md`, `backend/AGENTS.md`, `frontend/AGENTS.md` and `e2e/AGENTS.md`.

* E2E: compare the specs in `e2e/tests/` with the user stories of `REQUIREMENT.md` and the README improvements that
  are already implemented. For each feature without a spec, add its golden path and its most important error case
  (anonymous visitor, not the owner...). Move steps used by several specs, such as registering a user or uploading a
  video through the API, to `tests/support.ts`. Run the whole suite and repeat the new specs to check they are not
  flaky.
* Unit: read the JaCoCo report (`backend/target/site/jacoco/jacoco.xml`) and the Jest coverage
  (`frontend/coverage/coverage-final.json`) and cover the files with the most missed lines or branches when the
  missing case is real behaviour (error handling, a validation branch, browser APIs). Skip trivial getters.
* CI: check `.github/workflows/main.yml` against the checks the docs ask for before a PR, and add what is missing
  without making the pipeline slower.
* Update `DEVELOPMENT.md` and `AGENTS.md` if commands or checks change.

## Notes

* jsdom cannot decode video or draw on a canvas: browser-only code is tested by firing the media events by hand and
  mocking the canvas.
