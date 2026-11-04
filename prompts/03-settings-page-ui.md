# Settings page UI (placeholder controls)

**Approved on:** PENDING — proposed in the PR of branch `logIn`
**Approved by:** PENDING team review
**Used for:** building the UI of a feature whose behaviour other team members will implement later

## Prompt

Ahora me gustaría hacer el menú de configuración, el típico donde puedes ajustar idioma, dark mode y más cosas.
Prefiero que hagas primero los botones o tipos de configuración sin que hagan nada, porque hay cosas que tienen que
hacer mis compañeros.

(Original prompt in Spanish: "now I'd like to build the typical settings menu where you can change language, dark
mode and more. Build the buttons/setting types first without them doing anything, because some of it has to be done
by my teammates.")

Constraints applied:

* Gear button in the navbar opens a `SettingsPage` at the `/settings` route.
* Sections: Appearance (theme, text size), Language, Playback (autoplay, quality, speed), Notifications, Privacy,
  Account (only for logged-in users; buttons disabled).
* Controls are interactive but only change local state; a visible "Preview" notice says nothing is applied or saved,
  and "Save changes" is disabled.
* All settings, their types and defaults live in `frontend/src/settings/settings.ts` so teammates know where to plug
  in the real behaviour.
* Same ProTube styling as the login page and navbar (`theme.css` tokens).

## Notes

* To implement a setting: read/write it from `settings.ts`, apply it (e.g. `data-theme` on `<html>` for dark mode),
  persist it (localStorage or a backend endpoint) and enable "Save changes".
