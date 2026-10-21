---
name: create-rest-endpoint
description: Add a REST endpoint to the Spring Boot backend (DTO, service, controller, tests) following the team's layering. Use when a user story needs a new or changed /api route.
---

1. Read the user story and its acceptance criteria in `REQUIREMENT.md`, and the rules in `backend/AGENTS.md`.
2. DTOs: create `record` request/response classes in `controller/dto/`, with `jakarta.validation` constraints on
   the request fields.
3. Service: put the logic in a `@Service` class in `services/`, using repositories from `repository/`. Throw a
   domain exception for each error case and map it in `ApiExceptionHandler`.
4. Controller: add the method to the `@RestController` of that resource (`/api/<resource>`), with constructor
   injection, `@Valid @RequestBody` for inputs and `ResponseEntity` with the right status (200, 201, 204...).
5. If the route must be private or public, update `SecurityConfig` accordingly.
6. Tests:
   * Service unit test with Mockito for the happy path and each error.
   * Endpoint test with `@SpringBootTest` + `@AutoConfigureMockMvc` checking status codes and JSON fields.
7. Run `cd backend && mvn clean verify -Pcoverage` until it is green.
8. Document the new route in the PR description (method, path, body, responses) and link the issue.
