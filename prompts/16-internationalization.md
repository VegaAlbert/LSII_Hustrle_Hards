# Internationalization (i18n)

**Approved on:** PENDING — proposed in the PR of branch `feature/i18n`
**Approved by:** PENDING team review
**Used for:** implementing (#54) the "Internationalization (i18n)" extra feature of `README.md`: the whole UI translated to
English, Spanish and Catalan, a language selector in the navbar and Settings, the choice saved on the device, and the
backend error messages returned in the same language

## Prompt

The prompt was written in Catalan and is kept verbatim below (NFR-07 asks to preserve the exact prompt). Summary in
English: implement the "Translate the UI and allow the user to change language" product feature (Internationalization)
on a new branch, without touching the branch the author was already working on.

```text
Em podries fer tambe el Translate the UI and allow the user to change language.Product: Internationalization (i18n)m en una branch nova, pensa que ja estic treballant en una branch..
```

## Notes

* The work was done in a separate git worktree (`feature/i18n`, from an up-to-date `develop`) so the author's open
  branch and its uncommitted changes were not touched. The assistant followed `AGENTS.md`, `frontend/AGENTS.md`,
  `backend/AGENTS.md` and `e2e/AGENTS.md`, and reused the pattern of the dark mode feature
  (`prompts/15-dark-mode.md`): a provider + hook, preference in localStorage, an inline script in `index.html`.
* No i18n library was added: a small typed dictionary (`src/i18n/`) is enough for three languages and is easy to
  explain. `defineMessages()` makes TypeScript fail the build when a translation misses a key; plural forms use
  `Intl.PluralRules`, numbers `Intl.NumberFormat` and dates `Intl.RelativeTimeFormat`.
* The texts were extracted by several AI subagents in parallel, one per area (auth/settings, catalog/detail,
  upload/comments, analytics/library, backend), each owning its own messages file. The Spanish and Catalan texts
  should be proofread by the team.
* The backend uses Spring's `MessageSource` with `messages*.properties` and the `Accept-Language` header the frontend
  sends on every request; English is the fallback.
* Number 16 because 15 is dark mode.
