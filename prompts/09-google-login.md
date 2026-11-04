# Google login ("Sign in with Google")

**Approved on:** PENDING — proposed in the PR of branch `google-auth`
**Approved by:** PENDING team review
**Used for:** adding a third-party (OAuth / OpenID Connect) login next to the existing username/password login

## Prompt

implementa'm l'auth de google per a l'inici de sessio. Diga'm una vegada implementat que he de fer a la consola de
google cloud per obtenir el token

(English: "Implement Google authentication for login. Once implemented, tell me what I have to do in the Google
Cloud console to get the token.")

The agent followed the root, backend and frontend `AGENTS.md` files.

## Notes

* Design chosen: Google Identity Services button in the frontend → Google ID token → `POST /api/auth/google` →
  backend verifies it with `spring-security-oauth2-jose` (Google's public keys, issuer, audience = our client id,
  expiration, verified email) → existing ProTube JWT. The stateless JWT session is unchanged; no client secret.
* Accounts are matched by email; a first Google login creates a user whose username comes from the email and
  whose password is random (Google-only account).
* Config: `ENV_PROTUBE_GOOGLE_CLIENT_ID` (backend, compose) and `VITE_GOOGLE_CLIENT_ID` (frontend), documented in
  `DEVELOPMENT.md`.
