# Login page visual redesign

**Approved on:** PENDING — proposed in the PR of branch `logIn`
**Approved by:** PENDING team review
**Used for:** restyling an existing frontend page to look polished and professional without changing its behaviour

## Prompt

Mejora el login, hazlo más estético y que se vea profesional.

(Original prompt in Spanish: "improve the login, make it more aesthetic and look professional".)

Constraints applied:

* Keep `LoginPage.tsx` logic, validation rules and props unchanged; only the markup and styles change.
* Use the ProTube logo colours (violet → blue gradient) and the logo in `frontend/public/`.
* Split layout: brand panel with the gradient on desktop, form card only on mobile.
* Bootstrap floating labels, show/hide password button, loading spinner on submit.
* Styles colocated in `LoginPage.css`; Jest maps `.css` imports to a stub.
* Keep existing tests and accessible names (labels, button names) so tests keep passing; add tests for new behaviour.

Follow-up prompt: "sí, adapta también la navbar" (yes, adapt the navbar too) — same brand style for `NavBar.tsx`
(logo + gradient wordmark, gradient login button and avatar, styled user menu), Log in button hidden while the login
page is open, brand colours moved to shared tokens in `frontend/src/theme.css`.

## Notes

* The navbar height is the `--pt-navbar-height` token in `theme.css`; the login page uses it to fill the screen.
