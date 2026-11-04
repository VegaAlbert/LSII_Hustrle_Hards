# Login and register page (US-01 / US-02)

**Approved on:** PENDING — proposed in the PR of branch `feat/us-01-02-login-register`
**Approved by:** PENDING team review
**Used for:** implementing username/password authentication end to end (backend API + frontend page)

## Prompt

Build a login page so users can register, or log in if they are already registered, covering US-01 (User
registration) and US-02 (User login) in `REQUIREMENT.md`, and matching the mockup in `resources/mvp-authentication.png`.

Constraints:

* Follow the existing layering of the backend (`controller/` → `services/` → persistence) and the conventions in
  `CLAUDE.md`.
* Backend (Spring Boot 3, Java 21):
  * `User` JPA entity with unique username and email; store only a BCrypt hash of the password.
  * `POST /api/auth/register` (201, logs the user in), `POST /api/auth/login` (200), `GET /api/auth/me` (current user,
    401 without a valid session).
  * Stateless session with a signed JWT that expires (secret and expiration configurable in
    `application.properties`, secret overridable with an environment variable).
  * Validate input (`jakarta.validation`) and return JSON errors per field: 400 for invalid data, 409 for a taken
    username/email, 401 for wrong credentials (same message whether the username or the password is wrong).
  * Keep every existing endpoint (`/api/videos`, `/media/**`) public.
* Frontend (React + TypeScript, no router yet):
  * Login/register form with client-side validation mirroring the backend rules and showing backend errors next to
    each field.
  * Session kept in `localStorage`, token sent with axios, automatic logout when the token expires or the backend
    rejects it.
  * Navbar with the brand and a user menu (Log in / user initial + Logout).
* Tests: unit + integration tests for backend and frontend, keeping CI green (JaCoCo and Jest thresholds of 75%,
  ESLint + Prettier).

## Notes

* Users are stored with the current datasource (H2 in `dev`), so they are lost when the backend restarts until NFR-01
  (real database) is done.
* Google OAuth (configured in `application.properties`) is listed in README as an improvement, not part of this
  prompt.
