# Development guide

How to set up, run, test and build ProTube locally. For the assignment rules see [README.md](./README.md), and for
the MVP spec see [REQUIREMENT.md](./REQUIREMENT.md).

## Repository layout

| Folder                   | What it is                                                                 |
|--------------------------|----------------------------------------------------------------------------|
| `backend/`               | Spring Boot 3.3 REST API (Java 21, Maven). Serves `/api/**` and `/media/**` |
| `frontend/`              | React 19 + TypeScript SPA (Vite)                                           |
| `tooling/videoGrabber/`  | Python script that downloads sample videos into the video store folder     |
| `resources/`             | Images for the docs and `video_list.txt` (input for the video grabber)     |
| `.run/`                  | Shared IntelliJ IDEA run configurations                                    |
| `prompts/`               | Approved AI prompts (see the "Usage of AI" section of the README)          |

## Prerequisites

* **Java 21** (JDK; CI uses Amazon Corretto 21).
* **Maven 3.9+**. The Maven wrapper (`mvnw`) is **not** committed; either use your local `mvn`, or generate the
  wrapper once inside `backend/` with `mvn -N wrapper:wrapper` (CI does the equivalent). The commands below use
  `mvn`; swap in `./mvnw` if you generated it.
* **Node.js 22** and npm (CI uses Node 22; the production Maven build downloads Node v22.12.0 on its own).
* **Python 3, `yt-dlp` and `ffmpeg`** — only if you need to generate the sample videos.

## 1. Generate the video store

The backend reads videos from a *store* folder: one `.mp4` / `.webp` / `.json` triple per video, produced by the
video grabber. Do this once before running the backend.

```bash
cd tooling/videoGrabber
pip install -r dependencies.txt
python3 main.py --store=/absolute/path/to/videos --id=10 --videos=../../resources/video_list.txt
```

* `--id` is your group id (used to pick the set of videos).
* `--recreate` wipes and regenerates an existing store folder (without it, the script exits if the folder exists).
* Use `python` instead of `python3` on Windows if that's how Python is installed.
* `vars.py` uses `yt-dlp`, `ffmpeg` and `ffprobe` from your PATH. If yours live elsewhere, create
  `tooling/videoGrabber/vars_local.py` (gitignored) with your paths, e.g. `FFMPEG_BIN = "C:/tools/ffmpeg.exe"`.
  Never edit `vars.py` with personal paths.

## 2. Environment variables

| Variable                           | Needed for              | Description                                                                                      |
|------------------------------------|-------------------------|--------------------------------------------------------------------------------------------------|
| `ENV_PROTUBE_STORE_DIR`            | always                  | Absolute path of the video store folder. **End it with a path separator** (`/` or `\`) — it is used as a `file:` prefix to serve `/media/**`. |
| `ENV_PROTUBE_GOOGLE_CLIENT_ID`     | Google OAuth login      | Google OAuth client id                                                                           |
| `ENV_PROTUBE_GOOGLE_CLIENT_SECRET` | Google OAuth login      | Google OAuth client secret                                                                       |
| `ENV_PROTUBE_DB_HOST`              | `prod` profile          | PostgreSQL host (e.g. `localhost`, or the service name inside Docker Compose)                    |
| `ENV_PROTUBE_DB`                   | `prod` profile          | PostgreSQL database name (see [Using PostgreSQL](#using-postgresql))                              |
| `ENV_PROTUBE_DB_USER`              | `prod` profile          | Database user                                                                                    |
| `ENV_PROTUBE_DB_PASS`              | `prod` profile          | Database password                                                                                |
| `ENV_PROTUBE_LOAD_INITIAL_DATA`    | `prod` profile, optional | `true` imports the video store into the database on startup (default `false`; `dev` always imports) |

Never commit real secrets or personal paths. The shared run configurations in `.run/` do **not** set
`ENV_PROTUBE_STORE_DIR`: set it once as a user environment variable on your machine and restart IntelliJ.

```powershell
# Windows (permanent, for your user)
[Environment]::SetEnvironmentVariable("ENV_PROTUBE_STORE_DIR", "C:\path\to\protube-videos\", "User")
```

```bash
# Linux / macOS (add it to ~/.bashrc or ~/.zshrc)
export ENV_PROTUBE_STORE_DIR=/home/me/protube/videos/
```

## 3. Development mode

In development the backend and frontend run as two separate processes:

```
Browser ──► Vite dev server (http://localhost:5173) ──fetch──► Spring Boot (http://localhost:8080/api, /media)
```

### Backend

```bash
cd backend
mvn spring-boot:run
```

* Starts on **http://localhost:8080** with the `dev` profile (active by default through the Maven `dev` profile).
* `dev` uses an in-memory H2 database and loads initial data (`pro_tube.load_initial_data=true`). All data is lost
  on restart.
* From IntelliJ you can instead use the shared **ProtubeBackApplication** run configuration (`.run/`); it reads
  `ENV_PROTUBE_STORE_DIR` from your environment (section 2). Do not commit personal values in `.run/`.
* CORS is open for `/api/**` and `/auth/**`, so the Vite dev server can call the API directly.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

* Starts on **http://localhost:5173** with hot reload (or use the **frontend [DEV]** IntelliJ run configuration).
* API and media URLs come from `frontend/.env.development`:
  ```
  VITE_API_DOMAIN=http://localhost:8080
  VITE_MEDIA_DOMAIN=http://localhost:8080
  ```
  and are read through `src/utils/Env.ts` (`API_BASE_URL = ${VITE_API_DOMAIN}/api`,
  `MEDIA_BASE_URL = ${VITE_MEDIA_DOMAIN}/media`). To override locally without touching the committed file, create
  `frontend/.env.development.local`.

## 4. Tests, lint and formatting

### Backend

```bash
cd backend
mvn clean verify                          # build + all tests
mvn test -Dtest=ClassName                 # one test class
mvn test -Dtest=ClassName#methodName      # one test method
mvn clean verify -Pcoverage               # tests + JaCoCo report → target/site/jacoco/index.html
```

### Frontend

```bash
cd frontend
npm run test                              # Jest + Testing Library, coverage → coverage/
npx jest path/to/File.test.tsx            # a single test file
npm run lint                              # ESLint
npm run lint-fix                          # ESLint with autofix
npm run format                            # Prettier
```

The MVP requires **more than 50% coverage** on both apps.

### CI

`.github/workflows/main.yml` runs on every PR and push to `main`:

1. Frontend: `npm ci` → `npm run build` → `npm run test` → `npm run lint`
2. Backend: `./mvnw clean verify -Pcoverage`
3. Uploads both coverage reports as build artifacts.

Before opening a PR, run the same steps locally so the pipeline stays green.

## 5. Production mode

In production the frontend is bundled **inside** the backend jar and everything is served by Spring Boot from a
single origin (http://localhost:8080). The Maven `prod` profile:

1. Downloads Node/npm into `backend/target/`, runs `npm install` and `npm run build:prod` in `frontend/`.
2. Copies `frontend/dist/` into the jar's `static/` folder.
3. Activates the Spring `prod` profile (`ddl-auto=update`; the video store is only imported when
   `ENV_PROTUBE_LOAD_INITIAL_DATA=true`).

`frontend/.env.production` leaves `VITE_API_DOMAIN`/`VITE_MEDIA_DOMAIN` empty, so the built SPA calls the API with
relative URLs (`/api`, `/media`) on the same host.

### Run directly with Maven

```bash
cd backend
mvn -Pprod spring-boot:run
```

(IntelliJ: the shared **Production** run configuration does the same.)

### Build and run the jar

```bash
cd backend
mvn -Pprod clean package
java -jar target/protube-back-0.0.1-SNAPSHOT.jar
```

(IntelliJ: the **Create jar** run configuration runs `package` with the `prod` profile.) Remember that
`ENV_PROTUBE_STORE_DIR` and the four `ENV_PROTUBE_DB_*` variables must be set in the environment where the jar runs.

To only preview the production frontend bundle, without the backend: `cd frontend && npm run build:prod && npm run preview`.

### Run with Docker Compose (delivery, NFR-03)

The delivered application runs as three containers defined in [`compose.yaml`](./compose.yaml): `db`
(PostgreSQL 16), `backend` (Spring Boot, Spring `prod` profile) and `frontend` (nginx serving the built SPA and
proxying `/api` and `/media` to the backend). Only Docker is needed:

```bash
docker compose up --build
```

Then open http://localhost. Every variable has a default; to point Docker to your video store (or override anything
else), copy [`.env.example`](./.env.example) to `.env` in the repo root (it is gitignored) and set
`PROTUBE_STORE_DIR` to your store folder:

| Variable | Default | Purpose |
|---|---|---|
| `ENV_PROTUBE_DB` / `ENV_PROTUBE_DB_USER` / `ENV_PROTUBE_DB_PASS` | `protube` | PostgreSQL database and credentials |
| `PROTUBE_STORE_DIR` | `./videos` | Host folder with the video store, mounted into the backend |
| `ENV_PROTUBE_LOAD_INITIAL_DATA` | `true` | Import the video store into PostgreSQL on startup (already imported videos are skipped) |
| `PROTUBE_FRONTEND_PORT` / `PROTUBE_BACKEND_PORT` / `PROTUBE_DB_PORT` | `80` / `8080` / `5432` | Host ports |
| `ENV_PROTUBE_GOOGLE_CLIENT_ID` / `ENV_PROTUBE_GOOGLE_CLIENT_SECRET` | empty | Google OAuth credentials |

Database data lives in the `postgres_data` volume and survives `docker compose down`; use `docker compose down -v`
to wipe it. If `PROTUBE_STORE_DIR` is empty the app still starts, but there are no videos to serve — generate them
with the video grabber (section 1).

### Using PostgreSQL

The `prod` profile already points to PostgreSQL (`jdbc:postgresql://${ENV_PROTUBE_DB_HOST}:5432/${ENV_PROTUBE_DB}`
in `application.properties`); the MVP requires a real database (NFR-01 in [REQUIREMENT.md](./REQUIREMENT.md)). To
run it locally:

1. Start PostgreSQL, e.g. with the `db` service of `compose.yaml` (`docker compose up -d db`), which reads
   `ENV_PROTUBE_DB`, `ENV_PROTUBE_DB_USER` and `ENV_PROTUBE_DB_PASS`.
2. Set `ENV_PROTUBE_DB_HOST=localhost`, `ENV_PROTUBE_DB` (e.g. `protube`), `ENV_PROTUBE_DB_USER` (e.g. `postgres`) and
   `ENV_PROTUBE_DB_PASS`.
3. Run the backend with the `prod` profile (`mvn -Pprod spring-boot:run`).

## 6. Workflow reminders

* `main` and `develop` are protected by a ruleset: work in a `task/<issue>-short-name` branch from `develop` and open
  a Pull Request into `develop`; it needs one approval, all Copilot review comments resolved and green CI, and is
  squash-merged. Only release and hotfix PRs go into `main`. Full conventions: [AGENTS.md](./AGENTS.md).
* Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) and reference the task.
* If AI generated part of a change, mark it in the commit message and reference the prompt from `prompts/` that was
  used (see [prompts/README.md](./prompts/README.md)).
* Setting up the GitHub repository: [docs/GITHUB_SETUP.md](./docs/GITHUB_SETUP.md).

## Troubleshooting

* **`Could not resolve placeholder 'ENV_PROTUBE_STORE_DIR'`** (or `ENV_PROTUBE_DB_USER`, ...): the variable isn't
  set in the environment of the process running the app. IDEs usually need a restart to pick up new OS-level
  variables.
* **Videos list loads but thumbnails/videos 404**: check that `ENV_PROTUBE_STORE_DIR` ends with a path separator and
  points to the folder containing the `.mp4`/`.webp` files.
* **Frontend can't reach the API in dev**: make sure the backend is running on port 8080, or adjust
  `VITE_API_DOMAIN` in `.env.development.local`.
* **Port already in use**: change `server.port` (backend) or run `npm run dev -- --port 5174` (frontend). With Docker
  Compose, set `PROTUBE_FRONTEND_PORT` / `PROTUBE_BACKEND_PORT` / `PROTUBE_DB_PORT` in the root `.env`.
* **Docker backend keeps restarting with `role "..." does not exist`**: the `postgres_data` volume was initialised
  earlier with other credentials (PostgreSQL only applies `POSTGRES_USER`/`POSTGRES_PASSWORD` on first start). Reuse
  the old credentials in `.env`, or wipe the volume with `docker compose down -v`.
