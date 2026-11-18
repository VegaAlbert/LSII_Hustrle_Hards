# Frontend rules (React + TypeScript)

Applies to everything under `frontend/`. Root rules: [../AGENTS.md](../AGENTS.md). Based on the course session
"React and how to test it" (week 3).

- Function components and hooks, typed props (no `any`). Hooks only at the top level of a component. Shared logic
  goes in custom hooks (`useSomething`).
- Components in `src/components/`; pages in `src/pages/` once routing is added (`react-router-dom`, with a `Layout`
  - `Outlet`). API calls in a small module per feature (e.g. `src/auth/authApi.ts`).
- HTTP with `axios`, called from `useEffect` or an event handler, never during render; show loading and error
  states. URLs always built from `src/utils/Env.ts` (`API_BASE_URL`, `MEDIA_BASE_URL`).
- Lists need a stable `key` (an id, never the array index). Forms use controlled inputs with a `<label>`.
- Every user-visible text goes through i18n: `const { t, language } = useTranslation()` and `t('group.key')`, with
  the text in English, Spanish and Catalan in `src/i18n/messages/<group>.ts` (`defineMessages`: the build fails if a
  language misses a key). Never hardcode a visible string, an `aria-label` or a `title`. Counts use plural messages
  (`{ one, other }`) and `{placeholders}`; dates and numbers are formatted with `Intl` and the current `language`.
  Images need `alt`, buttons and inputs need an accessible name.
- Styles follow [docs/DESIGN_SYSTEM.md](../docs/DESIGN_SYSTEM.md): colours, radius and sizes through the `--pt-*`
  tokens of `src/theme.css`, never hardcoded values in component stylesheets.

## Tests (Jest + Testing Library)

- Test like a user: what is on screen, not the implementation. Files `*.test.tsx` in `__tests__/` next to the code.
- Queries in this order: `getByRole` → `getByLabelText` → `getByText` → `getByAltText`; `getByTestId` only as a
  last resort. `queryBy` to check something is absent, `findBy`/`waitFor` for async content; never `setTimeout`.
- Interactions with `@testing-library/user-event` (`const user = userEvent.setup()`, always `await`) instead of
  `fireEvent`. It is not installed yet: add it as a dev dependency in the first PR that needs it.
- Tests never call the real backend. Mock the network with MSW (course recommendation, to be added as a dev
  dependency) or, until then, mock the feature's API module with `jest.mock`.
- Components rendered without `<I18nProvider>` show English, so tests query the English texts. To test another
  language, render inside `<I18nProvider>` with `localStorage` key `protube.language` set to `es` or `ca`.
- Callbacks with `jest.fn()` and `toHaveBeenCalledWith`. Prefer `beforeEach` so tests stay independent.
- One `describe` per component, one behaviour per test; cover loading, success, empty and error states. No
  `console.log` left in tests.
- Coverage thresholds live in `jest.config.ts`; CI runs `npm run test -- --coverage`.
- Run `npm run test`, `npm run lint` and `npm run build` before pushing; fix with `npm run lint-fix` and
  `npm run format`.
- E2E tests (NFR-02) live in [`../e2e/`](../e2e/AGENTS.md) (Playwright). A new or changed page or flow also adds or
  updates its E2E test there. They find elements by role and label, so keep accessible names stable or update the
  E2E tests in the same PR.
