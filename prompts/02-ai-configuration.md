# AI configuration of the repository (NFR-06)

**Approved on:** PENDING — proposed in the PR of branch `feature/ai-config`
**Approved by:** PENDING team review
**Used for:** creating or updating the shared AI configuration (`AGENTS.md`, nested rules, skills, agents)

## Prompt

Set up the AI configuration of the repository following the "AI in the repository" session (week 2) and NFR-06 /
NFR-07 of `REQUIREMENT.md`:

1. Write a root `AGENTS.md` as the single source of truth: what the project is (2 lines), exact build/test/run
   commands, environment variables, a short architecture map, conventions (English only, Git flow with protected
   `main` and `develop`, `task/<issue>` branches, squash merge, Conventional Commits with the issue), AI usage rules
   and the Definition of Done. Short and specific; link long docs instead of copying them.
2. Turn `CLAUDE.md` into a one-line adapter: `@AGENTS.md`.
3. Add scoped rules as nested `backend/AGENTS.md` and `frontend/AGENTS.md` (with `CLAUDE.md` adapters), based on the
   conventions already used in the code (constructor injection, record DTOs, MockMvc tests, Testing Library queries
   by role).
4. Add one skill for a task we will repeat: `.claude/skills/create-rest-endpoint/SKILL.md`.
5. Add a read-only reviewer agent in `.claude/agents/reviewer.md` that answers with Blockers / Suggestions / Nits.
6. Fix the inconsistencies found between the docs and the code: database variables (`ENV_PROTUBE_DB_PASS`,
   `ENV_PROTUBE_DB_HOST`), the `prod` profile already using PostgreSQL, and the workflow now based on `develop`.
7. Make CI run on pull requests and pushes to `develop` as well as `main`.

Check every command and file path against the repository before writing it.

## Notes

* Test it by asking the agent "How do I run the tests?": the answer must come from `AGENTS.md`.
* `backend/AGENTS.md` mentions `AuthController`, `ApiExceptionHandler` and `ErrorResponse`, which arrive with the
  login PR (US-01/US-02).
* Any later change to these files goes through a PR reviewed by the team, like code.
