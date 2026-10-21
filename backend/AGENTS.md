# Backend rules (Spring Boot)

Applies to everything under `backend/`. Root rules: [../AGENTS.md](../AGENTS.md).

* Package root: `com.tecnocampus.LS2.protube_back`. Keep the layering `controller → services → repository`;
  controllers never use repositories directly.
* Constructor injection with `private final` fields (as in `AuthController`), not `@Autowired` on fields.
* Request/response bodies are Java `record` DTOs in `controller/dto/`, validated with `jakarta.validation`
  (`@Valid` + constraints with an English message). Never return JPA entities from a controller.
* Errors: throw a domain exception from the service and map it to an HTTP status in `ApiExceptionHandler`;
  error bodies use `ErrorResponse`.
* New configuration goes in `application.properties` read from an `ENV_PROTUBE_*` variable; secrets never get a
  committed real value.
* Tests (JUnit 5):
  * Services: unit tests with Mockito (`@ExtendWith(MockitoExtension.class)`).
  * Endpoints: `@SpringBootTest` + `@AutoConfigureMockMvc`, with `@Transactional` when they write data, and the
    properties `pro_tube.store.dir` and `pro_tube.load_initial_data=false` set in the annotation.
  * Cover the happy path and each error status (400, 401, 404, 409...).
* Check with `mvn clean verify -Pcoverage` before pushing.
