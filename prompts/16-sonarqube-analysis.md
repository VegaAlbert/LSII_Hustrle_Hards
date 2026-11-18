# SonarQube analysis in CI and locally

**Approved on:** PENDING — proposed in the PR of branch `feature/sonarqube`
**Approved by:** PENDING team review
**Used for:** adding or changing the code quality analysis (SonarQube / SonarCloud): `sonar-project.properties`, the
`sonarqube` services of `compose.yaml` and the SonarCloud step of `.github/workflows/main.yml`

## Prompt

Add SonarQube analysis (code smells, bugs, coverage) to the CI pipeline, following `AGENTS.md`. Work only on the
branch `feature/sonarqube`, created from an up-to-date `develop`. The GitHub Actions runs are currently blocked by a
billing lock on the repository owner's account, so the analysis must also work locally without GitHub.

* One Sonar project for the whole monorepo in a root `sonar-project.properties`: backend Java sources and tests,
  frontend `src/` with the Jest tests (`__tests__/`, `__mocks__/`, `*.test.ts(x)`) marked as tests. Import the
  backend coverage from the JaCoCo XML report and the frontend coverage from an lcov report (add `lcov` to the Jest
  coverage reporters). No token, organization or personal values in the file.
* Locally: a SonarQube Community server and a `sonar-scanner-cli` one-off service in `compose.yaml`, behind a
  `sonar` profile so a plain `docker compose up` does not start them. The token comes from the `SONAR_TOKEN`
  environment variable.
* CI: a SonarCloud step at the end of the `build-and-test` job, after the coverage reports are generated, using
  `SonarSource/sonarqube-scan-action`. It must be skipped (not fail) while the `SONAR_TOKEN` secret is missing. The
  organization comes from the `SONAR_ORGANIZATION` repository variable. Check out the full history.
* Document the local commands and the one-time SonarCloud setup in `DEVELOPMENT.md` and the commands in `AGENTS.md`.

## Notes

* SonarCloud's *Automatic Analysis* must be turned off, otherwise the CI analysis is rejected.
* The scan needs `backend/target/classes`: run `mvn clean verify -Pcoverage` before scanning.
