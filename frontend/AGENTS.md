# Frontend rules (React + TypeScript)

Applies to everything under `frontend/`. Root rules: [../AGENTS.md](../AGENTS.md).

* Function components and hooks, typed props (no `any`). Components in `src/components/`, data hooks next to the
  code that uses them, API calls in a small module per feature (e.g. `src/auth/authApi.ts`).
* HTTP with `axios`; URLs always built from `src/utils/Env.ts` (`API_BASE_URL`, `MEDIA_BASE_URL`).
* Every user-visible text in English; images need `alt`, buttons and inputs need an accessible name.
* Tests with Jest + Testing Library in `__tests__/` next to the code:
  * Query by role or label (`getByRole`, `getByLabelText`), not by CSS class or test id when avoidable.
  * Mock the API module or axios; tests never call the real backend.
  * One `describe` per component; cover loading, success, empty and error states.
  * No `console.log` left in tests.
* Run `npm run test`, `npm run lint` and `npm run build` before pushing; fix with `npm run lint-fix` and
  `npm run format`.
