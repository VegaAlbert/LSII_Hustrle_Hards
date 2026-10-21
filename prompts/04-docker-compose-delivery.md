# Containerized delivery with Docker Compose

**Approved on:** YYYY-MM-DD
**Approved by:** <pending team review>
**Used for:** containerizing the full application (backend, frontend, database) with Docker Compose

## Prompt

Del REQUIREMENT.md he d'implementar aquesta funcionalitat:

NFR-03: Containerized delivery
Requirement: The application must be delivered using containerization (e.g. docker-compose).

Acceptance criteria

Given a clean machine with Docker installed, when docker-compose up (or equivalent) is run, then the full
application (backend, frontend, database) starts and is usable without manual setup steps.
Priority: Must have

No facis el commit

## Notes

Produced `compose.yaml`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/docker/nginx.conf`, both
`.dockerignore` files and the Docker Compose section in `DEVELOPMENT.md`.
