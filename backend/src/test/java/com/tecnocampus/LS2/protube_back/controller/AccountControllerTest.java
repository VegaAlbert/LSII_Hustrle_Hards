package com.tecnocampus.LS2.protube_back.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.CommentRepository;
import com.tecnocampus.LS2.protube_back.repository.FavouriteRepository;
import com.tecnocampus.LS2.protube_back.repository.RatingRepository;
import com.tecnocampus.LS2.protube_back.repository.SubscriptionRepository;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoViewRepository;
import com.tecnocampus.LS2.protube_back.services.GoogleAccount;
import com.tecnocampus.LS2.protube_back.services.GoogleTokenVerifier;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Account settings through the real security chain and an in-memory database (rolled back after each test).
 */
@SpringBootTest({
        "pro_tube.store.dir=c:",
        "pro_tube.load_initial_data=false"
})
@AutoConfigureMockMvc
@Transactional
class AccountControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    UserRepository userRepository;

    @Autowired
    VideoRepository videoRepository;

    @Autowired
    EntityManager entityManager;

    @Autowired
    CommentRepository commentRepository;

    @Autowired
    RatingRepository ratingRepository;

    @Autowired
    FavouriteRepository favouriteRepository;

    @Autowired
    SubscriptionRepository subscriptionRepository;

    @Autowired
    VideoViewRepository videoViewRepository;

    @MockBean
    GoogleTokenVerifier googleTokenVerifier;

    private String register(String username, String email) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username": "%s", "email": "%s", "password": "password123"}
                                """.formatted(username, email)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    private String loginWithGoogle(String subject, String email) throws Exception {
        when(googleTokenVerifier.verify("google-token")).thenReturn(new GoogleAccount(subject, email, null));
        String response = mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"credential\": \"google-token\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    private ResultActions change(String field, String token, String body) throws Exception {
        var request = put("/api/account/" + field).contentType(MediaType.APPLICATION_JSON).content(body);
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        return mockMvc.perform(request);
    }

    private String tokenOf(ResultActions result) throws Exception {
        return objectMapper.readTree(result.andReturn().getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void changeUsernameReturnsANewSessionAndRenamesTheUploads() throws Exception {
        String token = register("alice", "alice@mail.com");
        User alice = userRepository.findByUsername("alice").orElseThrow();
        Video video = new Video("upload-1", "My video", null, "alice", 10, null, null, Instant.now(), "v.mp4", "t.webp");
        video.setUploader(alice);
        videoRepository.save(video);

        ResultActions result = change("username", token, "{\"username\": \"alicia\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value("alicia"))
                .andExpect(jsonPath("$.token").isNotEmpty());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + tokenOf(result)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alicia"));
        entityManager.flush();
        entityManager.clear();
        assertEquals("alicia", videoRepository.findById(video.getId()).orElseThrow().getAuthor());
    }

    @Test
    void changeUsernameRejectsTakenUsername() throws Exception {
        String token = register("alice", "alice@mail.com");
        register("bob", "bob@mail.com");

        change("username", token, "{\"username\": \"bob\"}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.fieldErrors.username").value("Username is already taken"));
    }

    @Test
    void changeUsernameRejectsInvalidUsername() throws Exception {
        String token = register("alice", "alice@mail.com");

        change("username", token, "{\"username\": \"a b\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.username").exists());
    }

    @Test
    void changeEmailUpdatesTheAccount() throws Exception {
        String token = register("alice", "alice@mail.com");

        change("email", token, "{\"email\": \"Alice@New.com\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("alice@new.com"));
    }

    @Test
    void changeEmailRejectsEmailOfAnotherAccount() throws Exception {
        String token = register("alice", "alice@mail.com");
        register("bob", "bob@mail.com");

        change("email", token, "{\"email\": \"bob@mail.com\"}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.fieldErrors.email").value("Email is already registered"));
    }

    @Test
    void changeEmailRejectsInvalidEmail() throws Exception {
        String token = register("alice", "alice@mail.com");

        change("email", token, "{\"email\": \"not-an-email\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").value("Email is not valid"));
    }

    @Test
    void changePasswordLetsTheUserLogInWithTheNewOne() throws Exception {
        String token = register("alice", "alice@mail.com");

        change("password", token, "{\"currentPassword\": \"password123\", \"newPassword\": \"new-password-1\"}")
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"alice\", \"password\": \"new-password-1\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() throws Exception {
        String token = register("alice", "alice@mail.com");

        change("password", token, "{\"currentPassword\": \"wrong\", \"newPassword\": \"new-password-1\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.currentPassword").value("Current password is incorrect"));
    }

    @Test
    void changePasswordRejectsShortNewPassword() throws Exception {
        String token = register("alice", "alice@mail.com");

        change("password", token, "{\"currentPassword\": \"password123\", \"newPassword\": \"short\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.newPassword").exists());
    }

    @Test
    void googleAccountChangesItsSettingsAndKeepsLoggingInWithGoogle() throws Exception {
        String token = loginWithGoogle("g-carol", "carol@gmail.com");

        // No current password: the account was created with Google
        String afterPassword = tokenOf(change("password", token, "{\"newPassword\": \"carol-password\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.hasPassword").value(true)));
        change("email", afterPassword, "{\"email\": \"carol@work.com\"}")
                .andExpect(status().isOk());

        // Google login still finds the account after the email change, and the new password works too
        when(googleTokenVerifier.verify("google-token")).thenReturn(new GoogleAccount("g-carol", "carol@gmail.com", null));
        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"credential\": \"google-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value("carol"))
                .andExpect(jsonPath("$.user.email").value("carol@work.com"));
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"carol\", \"password\": \"carol-password\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void accountChangesNeedALoggedInUser() throws Exception {
        change("username", null, "{\"username\": \"alicia\"}").andExpect(status().isUnauthorized());
        change("email", null, "{\"email\": \"a@mail.com\"}").andExpect(status().isUnauthorized());
        change("password", null, "{\"newPassword\": \"new-password-1\"}").andExpect(status().isUnauthorized());
    }

    @Test
    void oldTokenStopsWorkingAfterARename() throws Exception {
        String token = register("alice", "alice@mail.com");
        change("username", token, "{\"username\": \"alicia\"}").andExpect(status().isOk());

        change("email", token, "{\"email\": \"x@mail.com\"}").andExpect(status().isUnauthorized());
    }

    // ---- Delete account ----

    private ResultActions perform(String token, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON));
    }

    private ResultActions deleteAccount(String token, String body) throws Exception {
        var request = delete("/api/account").contentType(MediaType.APPLICATION_JSON).content(body);
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        return mockMvc.perform(request);
    }

    private Video saveVideo(String storeId, User uploader) {
        Video video = new Video(storeId, storeId, null, uploader == null ? "Imported" : uploader.getUsername(), 10,
                null, null, Instant.now(), storeId + ".mp4", storeId + ".webp");
        video.setUploader(uploader);
        return videoRepository.save(video);
    }

    private long commentOn(String token, Video video, String text) throws Exception {
        String body = perform(token, post("/api/videos/" + video.getId() + "/comments")
                .content("{\"text\": \"" + text + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    @Test
    void deleteAccountRemovesEverythingThatBelongsToIt() throws Exception {
        String alice = register("alice", "alice@mail.com");
        String bob = register("bob", "bob@mail.com");
        User aliceUser = userRepository.findByUsername("alice").orElseThrow();
        Video imported = saveVideo("imported", null);
        Video alicesVideo = saveVideo("upload-alice", aliceUser);

        // Alice on an imported video: a comment (replied and liked by Bob), a rating, a favourite and a view
        long alicesComment = commentOn(alice, imported, "Mine");
        perform(bob, post("/api/videos/" + imported.getId() + "/comments/" + alicesComment + "/replies")
                .content("{\"text\": \"Reply to alice\"}")).andExpect(status().isCreated());
        perform(bob, put("/api/videos/" + imported.getId() + "/comments/" + alicesComment + "/like"))
                .andExpect(status().isOk());
        long bobsComment = commentOn(bob, imported, "Bob stays");
        perform(alice, put("/api/videos/" + imported.getId() + "/comments/" + bobsComment + "/like"))
                .andExpect(status().isOk());
        perform(alice, put("/api/videos/" + imported.getId() + "/rating").content("{\"score\": 4}"))
                .andExpect(status().isOk());
        perform(alice, put("/api/favourites/" + imported.getId())).andExpect(status().isOk());
        perform(alice, post("/api/videos/" + imported.getId() + "/views")).andExpect(status().isNoContent());
        // Bob on Alice's video and channel
        commentOn(bob, alicesVideo, "Nice video");
        perform(bob, put("/api/videos/" + alicesVideo.getId() + "/rating").content("{\"score\": 5}"))
                .andExpect(status().isOk());
        perform(bob, put("/api/favourites/" + alicesVideo.getId())).andExpect(status().isOk());
        perform(bob, post("/api/videos/" + alicesVideo.getId() + "/views")).andExpect(status().isNoContent());
        perform(bob, put("/api/subscriptions/channel").param("name", "alice")).andExpect(status().isOk());
        perform(alice, put("/api/subscriptions/channel").param("name", "bob")).andExpect(status().isOk());

        deleteAccount(alice, "{\"password\": \"password123\"}").andExpect(status().isNoContent());

        entityManager.flush();
        entityManager.clear();
        assertTrue(userRepository.findByUsername("alice").isEmpty());
        assertTrue(videoRepository.findById(alicesVideo.getId()).isEmpty());
        // Only Bob's own comment is left, without Alice's like
        var comments = videoRepository.findById(imported.getId()).orElseThrow().getComments();
        assertEquals(1, comments.size());
        assertEquals("Bob stays", comments.get(0).getText());
        assertEquals(0, ratingRepository.count());
        assertEquals(0, favouriteRepository.count());
        assertEquals(0, subscriptionRepository.count());
        // Alice's view of the imported video is kept as an anonymous one
        assertEquals(1, videoViewRepository.count());
        assertNull(videoViewRepository.findAll().get(0).getViewer());
        assertEquals(1, commentRepository.count());

        // Her token no longer works, and her email and username can be registered again
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + alice))
                .andExpect(status().isUnauthorized());
        register("alice", "alice@mail.com");
        assertFalse(userRepository.findByUsername("bob").isEmpty());
    }

    @Test
    void deleteAccountRejectsWrongPassword() throws Exception {
        String token = register("alice", "alice@mail.com");

        deleteAccount(token, "{\"password\": \"wrong\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.password").value("Password is incorrect"));
        assertTrue(userRepository.findByUsername("alice").isPresent());
    }

    @Test
    void googleAccountWithoutPasswordConfirmsTheDeletionWithItsUsername() throws Exception {
        String token = loginWithGoogle("g-carol", "carol@gmail.com");

        deleteAccount(token, "{\"confirmation\": \"someone-else\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.confirmation").value("Type your username to confirm"));
        deleteAccount(token, "{\"confirmation\": \"carol\"}").andExpect(status().isNoContent());

        assertTrue(userRepository.findByUsername("carol").isEmpty());
    }

    @Test
    void deleteAccountNeedsALoggedInUser() throws Exception {
        deleteAccount(null, "{\"password\": \"password123\"}").andExpect(status().isUnauthorized());
    }

    @Test
    void renamedUserKeepsItsCommentsUnderTheNewName() throws Exception {
        String token = register("alice", "alice@mail.com");
        Video imported = saveVideo("imported", null);
        commentOn(token, imported, "Hello");

        change("username", token, "{\"username\": \"alicia\"}").andExpect(status().isOk());

        entityManager.flush();
        entityManager.clear();
        assertEquals("alicia", commentRepository.findAll().get(0).getAuthor());
    }

    @Test
    void renamedUserKeepsTheSubscribersOfItsChannel() throws Exception {
        String alice = register("alice", "alice@mail.com");
        String bob = register("bob", "bob@mail.com");
        perform(bob, put("/api/subscriptions/channel").param("name", "alice")).andExpect(status().isOk());

        change("username", alice, "{\"username\": \"alicia\"}").andExpect(status().isOk());

        mockMvc.perform(get("/api/subscriptions/channel").param("name", "alicia")
                        .header("Authorization", "Bearer " + bob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(true))
                .andExpect(jsonPath("$.subscribers").value(1));
    }
}
