# ProTube

Video platform where registered users watch, upload and comment on videos (Software Lab II, Tecnocampus).
Monorepo: `backend/` (Spring Boot 3.3, Java 21, Maven) and `frontend/` (React 19 + TypeScript, Vite), plus
`tooling/videoGrabber/` (Python script that fills the video store).

Assignment rules: [README.md](./README.md). MVP user stories and NFRs: [REQUIREMENT.md](./REQUIREMENT.md) — read the
acceptance criteria of a story before implementing it. Setup details: [DEVELOPMENT.md](./DEVELOPMENT.md).
Each folder has its own `AGENTS.md` with the rules for that app: [backend](./backend/AGENTS.md),
[frontend](./frontend/AGENTS.md).

## Commands

The Maven wrapper is not committed: use `mvn` locally (CI generates `./mvnw`).

* Backend run: `cd backend && mvn spring-boot:run` (profile `dev`, port 8080). Needs `ENV_PROTUBE_STORE_DIR`.
* Backend tests: `cd backend && mvn clean verify` · one class: `mvn test -Dtest=ClassName`
* Backend coverage: `cd backend && mvn clean verify -Pcoverage` → `backend/target/site/jacoco/index.html`
* Frontend: `cd frontend && npm install && npm run dev` (port 5173)
* Frontend tests (with coverage): `cd frontend && npm run test` · one file: `npx jest path/to/File.test.tsx`
* Frontend checks: `npm run lint`, `npm run format`, `npm run build`

Before opening a PR, run what CI runs (`.github/workflows/main.yml`): frontend `npm ci`, `npm run build`,
`npm run test`, `npm run lint`; backend `mvn clean verify -Pcoverage`.

## Environment

* `ENV_PROTUBE_STORE_DIR`: absolute path of the video store, **ending with a separator** (`/` or `\`). Always needed.
* `prod` profile uses PostgreSQL: `ENV_PROTUBE_DB_HOST`, `ENV_PROTUBE_DB`, `ENV_PROTUBE_DB_USER`, `ENV_PROTUBE_DB_PASS`.
* `ENV_PROTUBE_LOAD_INITIAL_DATA` (`prod`, default `false`; `true` in `compose.yaml`): import the video store on
  startup. `dev` always imports it.
* `dev` profile uses in-memory H2 with initial data: everything is lost on restart. H2 is not allowed in the final
  delivery (NFR-01).
* Personal values live outside the repo: root `.env` (Docker, from `.env.example`), user env var
  `ENV_PROTUBE_STORE_DIR` (IntelliJ) and `tooling/videoGrabber/vars_local.py` (videoGrabber paths).
* Never commit secrets, personal paths or local files: `.mcp.json`, `.env`, `vars_local.py`, `tooling/videoGrabber/vars.py` changes,
  `.idea/`, personal values in the shared `.run/` configurations.

## Architecture

* Backend layering: `controller/` (REST under `/api/**`, DTOs in `controller/dto/`) → `services/` (business logic)
  → `repository/` (Spring Data JPA) with entities in `domain/`. Config in `configuration/`.
* Media files are served from the store under `/media/**` (`MvcConfig`). Read the store path through
  `pro_tube.store.dir`, never hardcode it.
* Frontend calls the API through `src/utils/Env.ts` (`API_BASE_URL`, `MEDIA_BASE_URL`), never with hardcoded URLs.

## Conventions

* **English only**: code, comments, docs, commits, PRs and issues.
* Git flow: `main` (releases only) and `develop` (integration) are protected. Never push to them.
  * Branch from an up-to-date `develop`: `task/<issue>-short-name` (one ticket) or `feature/<short-name>`.
  * PR into `develop`, linked to its issue. 1 approval, all Copilot comments resolved, CI green, **squash merge**,
    delete the branch. Only release/hotfix PRs go into `main`.
* Commits: [Conventional Commits](https://www.conventionalcommits.org/) with the issue,
  e.g. `feat(videos): list videos from the store (#4)`.
* Every member does backend, frontend and tests of their own user stories.

## AI usage (NFR-06, NFR-07)

* Changes to this file, nested `AGENTS.md`/`CLAUDE.md`, `.claude/` or `prompts/` go through a PR like code.
* A prompt used to generate code or architecture must be saved in `prompts/` (see `prompts/README.md`), reviewed by
  the team, and committed with the PR that used it. Reuse an existing prompt for the same kind of task.
* AI-assisted commits say so and cite the prompt and the task, e.g. a body line
  `AI-assisted: prompts/02-ai-configuration.md (#17)`.
* The author must understand and be able to explain every generated line (it is asked in the exam).

## Definition of Done

* Acceptance criteria of the story in `REQUIREMENT.md` are met.
* Backend and frontend tests added for the change; coverage stays above 50% on both apps (NFR-05).
* Lint and build pass locally and CI is green on the PR.
* PR approved by a teammate, Copilot comments resolved, squash-merged into `develop`.
* Docs (`DEVELOPMENT.md`, this file) updated if commands, env vars or conventions changed.
