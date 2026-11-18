# Setting up "Sign in with Google"

Step-by-step guide for teammates to enable Google login on their machine. Google login is **optional**: without a
client id the app works as usual and the Google button is just hidden.

## How it works (1 minute)

```
Browser ── Google button (Google Identity Services, uses VITE_GOOGLE_CLIENT_ID) ──► Google
   │                                            ◄── ID token (JWT signed by Google)
   └── POST /api/auth/google { credential } ──► Backend (GoogleTokenVerifier, uses ENV_PROTUBE_GOOGLE_CLIENT_ID)
                                                 checks signature, issuer, audience = our client id, expiry,
                                                 verified email → logs in / creates the user → ProTube JWT
```

* There is **only a client id**, no client secret. The client id is public (it ends up in the frontend bundle), so
  it can be shared in the team chat. It is still kept out of the repo so each one decides whether to enable it.
* The **same client id** must be set in two places: the backend (`ENV_PROTUBE_GOOGLE_CLIENT_ID`) and the frontend
  (`VITE_GOOGLE_CLIENT_ID`). If they differ, Google login fails with *Invalid Google credential*.

## 1. Get the client id

The team shares one OAuth client created in [Google Cloud Console](https://console.cloud.google.com/) →
*APIs & Services* → *Credentials*. Ask its owner for the value; it looks like
`1234567890-abc123def456.apps.googleusercontent.com`.

While the app is in *Testing* mode on Google, only accounts listed as **test users** can sign in. Send the owner the
Google account(s) you will log in with so they add them (see [For the owner of the OAuth client](#for-the-owner-of-the-oauth-client)).

## 2. Backend

Set the environment variable `ENV_PROTUBE_GOOGLE_CLIENT_ID`, the same way as `ENV_PROTUBE_STORE_DIR`:

```powershell
# Windows (permanent, for your user). Restart IntelliJ / the terminal afterwards
[Environment]::SetEnvironmentVariable("ENV_PROTUBE_GOOGLE_CLIENT_ID", "<client id>", "User")
```

```bash
# Linux / macOS (add it to ~/.bashrc or ~/.zshrc, then open a new terminal / restart IntelliJ)
export ENV_PROTUBE_GOOGLE_CLIENT_ID=<client id>
```

The backend reads it through `pro_tube.google.client-id` in `application.properties`. Restart the backend after
setting it.

## 3. Frontend (dev, `npm run dev`)

Create `frontend/.env.development.local` (gitignored by `*.local`) with:

```properties
VITE_GOOGLE_CLIENT_ID=<client id>
```

Then **restart** `npm run dev`: Vite only reads `.env` files on startup. For a production build (`npm run build:prod`
or the jar) put the same line in `frontend/.env.production.local`.

Do not put the value in the committed `frontend/.env.development` / `.env.production`.

## 4. Docker (`docker compose up`)

Add the line to the root `.env` (copied from `.env.example`, gitignored):

```properties
ENV_PROTUBE_GOOGLE_CLIENT_ID=<client id>
```

`compose.yaml` passes it to the backend container and, as the build arg `VITE_GOOGLE_CLIENT_ID`, to the frontend
image. The id is baked into the frontend bundle at build time, so rebuild: `docker compose up --build`.

## 5. Check it works

1. Open the login page (`http://localhost:5173` in dev, `http://localhost` with Docker).
2. Below the normal form there is an "or" divider and a **Continue with Google** button.
3. Pick your Google account → you land logged in. A new ProTube user is created with your Google email the first
   time; if a user with that email already exists, you log in as that user.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| No Google button | `VITE_GOOGLE_CLIENT_ID` empty in the frontend | Check the `.local` file name and location (`frontend/`), restart `npm run dev` / rebuild Docker |
| Google popup: *Error 400: origin_mismatch* / *The given origin is not allowed* | The URL you opened is not an authorized JavaScript origin | Use exactly `http://localhost:5173`, `http://localhost` or `http://localhost:8080` (not `127.0.0.1`), or ask the owner to add your origin |
| Google popup: *Error 403: access_denied* | Your Google account is not a test user | Ask the owner to add it |
| *Google login is not available* | Backend has no client id | Set `ENV_PROTUBE_GOOGLE_CLIENT_ID` and restart the backend (and IntelliJ, so it sees the new variable) |
| *Invalid Google credential* | Backend and frontend have different client ids, or the token expired | Use the same value in both places |
| *Your Google account has no verified email* | The Google account email is not verified | Use another account |

## For the owner of the OAuth client

In Google Cloud Console, project used for ProTube:

1. *APIs & Services* → *OAuth consent screen*: user type *External*, publishing status *Testing*. Under
   *Test users* (or *Audience* → *Test users*) add every teammate's Google account.
2. *APIs & Services* → *Credentials* → the OAuth client (type *Web application*) → *Authorized JavaScript origins*:
   `http://localhost:5173`, `http://localhost`, `http://localhost:8080`. No redirect URIs are needed.
3. Share the **Client ID** with the team. Never share or commit the client secret: the app does not use it.

Changes in Google Cloud Console can take a few minutes to apply.
