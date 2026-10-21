package com.tecnocampus.LS2.protube_back.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end checks of the auth endpoints through the real security chain and an in-memory database.
 * Each test runs in a transaction that is rolled back, so tests don't see each other's users.
 */
@SpringBootTest({
        "pro_tube.store.dir=c:",
        "pro_tube.load_initial_data=false"
})
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    private String registerBody(String username, String email, String password) {
        return """
                {"username": "%s", "email": "%s", "password": "%s"}
                """.formatted(username, email, password);
    }

    private String loginBody(String username, String password) {
        return """
                {"username": "%s", "password": "%s"}
                """.formatted(username, password);
    }

    private String register(String username, String email) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(username, email, "password123")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(response);
        return json.get("token").asText();
    }

    @Test
    void registeredUserIsLoggedInWithTheReturnedToken() throws Exception {
        String token = register("alice", "alice@mail.com");

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.email").value("alice@mail.com"));
    }

    @Test
    void registerRejectsDuplicateUsername() throws Exception {
        register("alice", "alice@mail.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("alice", "other@mail.com", "password123")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.fieldErrors.username").value("Username is already taken"));
    }

    @Test
    void registerRejectsDuplicateEmail() throws Exception {
        register("alice", "alice@mail.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("bob", "alice@mail.com", "password123")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.fieldErrors.email").value("Email is already registered"));
    }

    @Test
    void registerRejectsInvalidEmailAndShortPassword() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("alice", "not-an-email", "short")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").value("Email is not valid"))
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void registerRejectsMalformedBody() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed request body"));
    }

    @Test
    void loginWithCorrectCredentialsReturnsToken() throws Exception {
        register("alice", "alice@mail.com");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody("alice", "password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value("alice"));
    }

    @Test
    void loginWithWrongPasswordIsRejected() throws Exception {
        register("alice", "alice@mail.com");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody("alice", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void meWithoutTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meWithInvalidTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer invalid"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void videosStayPublic() throws Exception {
        mockMvc.perform(get("/api/videos"))
                .andExpect(status().isOk());
    }
}
