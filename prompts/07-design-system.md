# Design system (style guide)

**Approved on:** PENDING — proposed in the PR of branch `feature/style-guide`
**Approved by:** PENDING team review
**Used for:** creating or changing the ProTube visual style: the style guide in Google Stitch / Figma, the design
tokens in `frontend/src/theme.css` and `docs/DESIGN_SYSTEM.md`

## Prompt

Two prompts were used, in this order.

### 1. Style guide in Google Stitch (exported to Figma)

Design a style guide / design system page for "ProTube", a video-sharing web app (users watch, upload and comment on
videos). Desktop, dark theme first, with a light variant. The frontend is built with Bootstrap 5, so keep tokens and
components compatible with it.

Brand:

* Logo: monogram where a capital "P" is rotated 180° (stem on the right, bowl bottom-left) and the stem rises into a
  capital "T" with a crossbar on top. Show it as icon, icon + wordmark "ProTube", and favicon size (32px). Include
  clear-space and minimum-size rules.
* Personality: modern, clean, friendly, student-made but professional.

Colour tokens (with hex values and names):

* Background dark #212529, surface/card #2B3035, border #343A40, text primary #F8F9FA, text secondary #ADB5BD.
* Accent/primary red #E63946 (+ hover and pressed shades), plus success, warning, danger, info.
* Show contrast pairs that pass WCAG AA.

Typography: Inter (or similar sans-serif). Scale with sizes, weights and line heights for H1–H4, body, small,
caption, button label, video title (2 lines max), metadata (author · duration).

Spacing & shape: 4/8px spacing scale, border radius tokens (4, 8, 12, pill), elevation/shadows, 12-column grid with
breakpoints matching Bootstrap (sm 576, md 768, lg 992, xl 1200).

Components (each with default, hover, focus, disabled states): navbar with logo, centered search bar and user menu
(Log in button / user initial avatar + Logout); search bar with icon and clear button; video card (16:9 thumbnail
with duration badge, title, author); video grid (4 columns desktop, 2 tablet, 1 mobile) + pagination; video player
page (player, title, author, description, comment list); comment item and comment input; login / register form
(inputs, inline validation errors, primary and secondary buttons); empty state, loading skeleton for cards, error
alert, toast.

Iconography: rounded line icons (e.g. Bootstrap Icons style), 20/24px.

Lay out the page as a clean, labelled design-system sheet ready to export to Figma.

### 2. Applying the style guide to the code

Apply the ProTube style guide exported from Stitch to the frontend, following `AGENTS.md` and `frontend/AGENTS.md`:

* Write it as `docs/DESIGN_SYSTEM.md` (English): brand and PT monogram, colour tokens for the dark default theme and
  the light variant, typography scale (Inter), spacing, radius, grid, and the anatomy of navbar, video card, video
  player page and buttons (primary, secondary, ghost, disabled).
* Leave out what is not in `REQUIREMENT.md` (Upload button, notifications, Subscribe, view counts, verified badges,
  `Ctrl+K`) and list it as out of scope.
* Put the tokens in `frontend/src/theme.css` as `--pt-*` CSS variables, map Bootstrap's variables to them and make
  dark the default with `data-bs-theme="dark"`. Replace the old indigo/blue colours and every hardcoded colour in the
  component stylesheets with the tokens. Do not change component markup or behaviour.
* Link the guide from `frontend/AGENTS.md` so AI-generated UI follows it.

## Notes

* The style guide returned by Stitch was in Catalan and was translated when written to `docs/DESIGN_SYSTEM.md`.
* The light variant's secondary text colour (`#6C757D`) is not in the Stitch guide: it is Bootstrap's default.
* The PT monogram SVG (`frontend/public/protube-logo.svg`) was provided by the team and added as is, not generated
  with these prompts.
* The theme setting of the settings page is still a placeholder, so the light variant is defined but not reachable.
