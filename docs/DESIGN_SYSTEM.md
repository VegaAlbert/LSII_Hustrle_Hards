# ProTube design system

Visual rules for every screen of the frontend. The tokens live in
[`frontend/src/theme.css`](../frontend/src/theme.css): use them through `var(--pt-...)` and never hardcode a colour
in a component stylesheet. The UI is built on Bootstrap 5, so prefer Bootstrap classes and only add custom CSS when
Bootstrap has no equivalent.

## Brand

* **Logo (PT monogram):** a capital "P" rotated 180° (vertical stem on the right, bowl at the bottom-left; not a
  normal "P", a "b" or a "q") whose stem rises into a capital "T" with a horizontal crossbar on top. The asset is
  [`frontend/public/protube-logo.svg`](../frontend/public/protube-logo.svg) (brand red on a transparent
  background), also used as the favicon.
* **Wordmark:** "ProTube", with "Pro" in the primary text colour and "Tube" in the brand red.
* **Personality:** modern, clean and friendly; made by students, finished like a professional product.

## Colours

Dark is the default theme (`data-bs-theme="dark"` on `<html>`). The light variant only redefines the neutral tokens.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--pt-bg-body` | `#212529` | `#F8F9FA` | Page background |
| `--pt-surface` | `#2B3035` | `#FFFFFF` | Cards, panels, menus, inputs |
| `--pt-border` | `#343A40` | `#DEE2E6` | Dividers, card and input borders |
| `--pt-text-primary` | `#F8F9FA` | `#212529` | Titles and body text |
| `--pt-text-secondary` | `#ADB5BD` | `#6C757D` | Metadata, hints, timestamps |

| Token | Value | Use |
|---|---|---|
| `--pt-primary` | `#E63946` | Brand red: primary buttons, links, focus, active states |
| `--pt-primary-hover` | `#D62828` | Hover of primary elements |
| `--pt-primary-pressed` | `#B71C1C` | Pressed state |
| `--pt-success` | `#2EC4B6` | Validation, success messages |
| `--pt-warning` | `#FFB703` | Warnings |
| `--pt-danger` | `#E63946` | Errors and destructive actions |
| `--pt-info` | `#4CC9F0` | Informative labels |

`--pt-primary-rgb` (`230, 57, 70`) is there for translucent tints, e.g. `rgba(var(--pt-primary-rgb), 0.12)`.

Any text on a background must reach a contrast ratio of at least 4.5:1 (WCAG 2.1 AA). White text on the brand red
is only for buttons and badges with bold or large text.

## Typography

Font stack: `Inter, system-ui, -apple-system, sans-serif`.

| Style | Size / line height | Weight | Letter spacing |
|---|---|---|---|
| H1 / display | 32 / 40px | 700 | -0.02em |
| H2 | 24 / 32px | 600 | -0.01em |
| H3 | 20 / 28px | 600 | -0.005em |
| H4 / subtitle | 16 / 24px | 500 | — |
| Body | 14 / 20px | 400 | — |
| Metadata / small | 12 / 16px | 400 | — (colour `--pt-text-secondary`) |
| Video title | 16 / 22px | 500 | — (two lines max with `-webkit-line-clamp: 2`) |

## Spacing, radius and grid

* Spacing in multiples of 4px: 4, 8, 16, 24, 32, 48 (Bootstrap spacers `1`–`5` cover most of them).
* Radius tokens: `--pt-radius-sm` 4px (badges, tags, compact inputs), `--pt-radius-md` 8px (thumbnails, cards,
  panels), `--pt-radius-lg` 12px (modals, player, menus), `--pt-radius-pill` (primary call-to-action buttons,
  filter pills).
* Bootstrap 12-column grid and breakpoints: `sm` 576px, `md` 768px, `lg` 992px, `xl` 1200px, `xxl` 1400px.

## Components

* **Navbar:** sticky, height `--pt-navbar-height` (64px), background `--pt-bg-body` with a `--pt-border` bottom
  border. Logo on the left, search in the middle, user menu on the right (Log in button, or the user initial avatar
  with Settings and Logout).
* **Video card:** 16:9 thumbnail with `object-fit: cover` and `--pt-radius-md`, duration badge at the bottom-right,
  title (two lines max) and author below.
* **Video player page:** 16:9 player in a `--pt-radius-lg` frame, title, author, description and the comment list.
* **Buttons:**
  * Primary: background `--pt-primary`, white text, hover `--pt-primary-hover`, 2px light red focus ring.
  * Secondary: background `--pt-surface`, border `--pt-border`, text `--pt-text-primary`.
  * Ghost: transparent, border `--pt-border`, text `--pt-text-secondary`, hover background `--pt-surface`.
  * Disabled: 50% opacity and `cursor: not-allowed`.
* **Icons:** Bootstrap Icons style, rounded line icons, 20 or 24px.

## Out of scope for the MVP

The original style guide also draws an Upload button in the navbar, notifications, a Subscribe button, view
counts, verified badges and a `Ctrl+K` search shortcut. They are not in `REQUIREMENT.md`: design them only when a
user story asks for them.
