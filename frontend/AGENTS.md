# Frontend rules (React + TypeScript)

Applies to everything under `frontend/`. Root rules: [../AGENTS.md](../AGENTS.md). Based on the course session
"React and how to test it" (week 3).

* Function components and hooks, typed props (no `any`). Hooks only at the top level of a component. Shared logic
  goes in custom hooks (`useSomething`).
* Components in `src/components/`; pages in `src/pages/` once routing is added (`react-router-dom`, with a `Layout`
  + `Outlet`). API calls in a small module per feature (e.g. `src/auth/authApi.ts`).
* HTTP with `axios`, called from `useEffect` or an event handler, never during render; show loading and error
  states. URLs always built from `src/utils/Env.ts` (`API_BASE_URL`, `MEDIA_BASE_URL`).
* Lists need a stable `key` (an id, never the array index). Forms use controlled inputs with a `<label>`.
* Every user-visible text in English; images need `alt`, buttons and inputs need an accessible name.
* Styles follow [docs/DESIGN_SYSTEM.md](../docs/DESIGN_SYSTEM.md): colours, radius and sizes through the `--pt-*`
  tokens of `src/theme.css`, never hardcoded values in component stylesheets.

## Tests (Jest + Testing Library)

* Test like a user: what is on screen, not the implementation. Files `*.test.tsx` in `__tests__/` next to the code.
* Queries in this order: `getByRole` → `getByLabelText` → `getByText` → `getByAltText`; `getByTestId` only as a
  last resort. `queryBy` to check something is absent, `findBy`/`waitFor` for async content; never `setTimeout`.
* Interactions with `@testing-library/user-event` (`const user = userEvent.setup()`, always `await`) instead of
  `fireEvent`. It is not installed yet: add it as a dev dependency in the first PR that needs it.
* Tests never call the real backend. Mock the network with MSW (course recommendation, to be added as a dev
  dependency) or, until then, mock the feature's API module with `jest.mock`.
* Callbacks with `jest.fn()` and `toHaveBeenCalledWith`. Prefer `beforeEach` so tests stay independent.
* One `describe` per component, one behaviour per test; cover loading, success, empty and error states. No
  `console.log` left in tests.
* Coverage thresholds live in `jest.config.ts`; CI runs `npm run test -- --coverage`.
* Run `npm run test`, `npm run lint` and `npm run build` before pushing; fix with `npm run lint-fix` and
  `npm run format`.
* E2E tests (NFR-02) will live in their own folder with their own runner (the course uses Playwright).
