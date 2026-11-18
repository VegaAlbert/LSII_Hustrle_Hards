# Settings: working preferences and account changes

**Approved on:** PENDING — proposed in the PR of branch `feature/settings-fixes`
**Approved by:** PENDING team review
**Used for:** turning placeholder settings (see `03-settings-page-ui.md`) into working ones, and account changes that
must keep one account per email, also with "Sign in with Google"

## Prompt

Implement these fixes to the settings page. Fix text size, autoplay and playback speed. The account settings must be
changeable, even for accounts created with Google SSO. Also, if an account with an email already exists, do not let
it be registered again, not even with SSO (apply the best decision aligned with the requirements of
`REQUIREMENT.md`). Remove default quality and notifications, which make no sense. Implement the needed unit, E2E and
CI tests.

(Original prompt in Catalan: "Implementa les següents correccions a settings. Has d'arreglar text size, autoplay,
playback speed, les configuracions del compte els has de poder canviar, inclús si és SSO de Google. A part si ja
existeix un compte amb el mail, no deixar registrar-la de nou, ni amb el SSO (aplica la millor decisió alineada amb
els requeriments de REQUIREMENT.md). Treu lo de default quality, i notificacions que no tenen sentit. Implementa els
tests necessaris unitaris, e2e, i ci".)

Follow-up prompt: "There must be the delete account button and everything it involves." (Original in Catalan: "hi
ha d'haver el botó de delete account i tot el que comporta".)

Decisions taken:

* US-01 ("no duplicate account is created"): registering an email that already has an account answers 409, ignoring
  capital letters. "Sign in with Google" with an email that already has an account **logs in to that account and
  links it** (Google verifies the email) instead of creating a second one. The Google `sub` is saved, so Google login
  keeps working after the user changes the email.
* Text size, autoplay and playback speed are applied and saved on this device at once, like the theme
  (`protube.preferences` in localStorage). Text size scales the root font size (all sizes are in rem). The "Save
  changes" button is removed because nothing waits to be saved.
* Account: `PUT /api/account/{username,email,password}` for the logged-in user. Each answers a new session (the JWT
  holds the username). Accounts created with Google have no known password: they set their first one without the
  current password (`hasPassword: false` in the user).
* Delete account: `DELETE /api/account` (204), confirmed with the password, or by typing the username for Google
  accounts that never set one. In one transaction it deletes the uploaded videos (with their tags, comments, ratings,
  favourites and views), the user's comments with their replies, its comment likes, ratings, favourites and
  subscriptions (both ways). Its views of other videos are kept as anonymous views so the analytics of their owners
  do not change. The files of the deleted videos are removed from the store after the commit. The frontend then logs
  out and goes home.
* Comments written in ProTube are linked to their account (`comments.user_id`), so they are renamed with the
  username and deleted with the account without touching imported comments that happen to have the same author name.
* Language and privacy stay as they were (not saved yet).

## Notes

* Accounts created with Google before this change are marked as having a password (column default), so they need
  their current password to change it.
* Comments posted before `comments.user_id` existed have no account linked: they keep the old name after a rename
  and are not deleted with the account.
* `loginAsNewUser()` in the E2E tests puts its first session back on every page load: account tests must not reload
  the page after a username change.
