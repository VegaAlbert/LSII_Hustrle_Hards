package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import com.tecnocampus.LS2.protube_back.services.JwtService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Checks the subscription routes (US-13) through the real security chain and the in-memory database.
 * Each test runs in a transaction that is rolled back.
 */
@SpringBootTest({
        "pro_tube.store.dir=c:",
        "pro_tube.load_initial_data=false"
})
@AutoConfigureMockMvc
@Transactional
class SubscriptionsControllerTest {

    private static final String BOB_CHANNEL = "/api/channels/bob/subscription";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    VideoRepository videoRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    JwtService jwtService;

    @Autowired
    EntityManager entityManager;

    User bob;
    User carol;
    String token;

    @BeforeEach
    void setUp() {
        userRepository.save(new User("alice", "alice@example.com", "hash"));
        bob = userRepository.save(new User("bob", "bob@example.com", "hash"));
        carol = userRepository.save(new User("carol", "carol@example.com", "hash"));
        token = jwtService.generateToken("alice");
        flushAndClear();
    }

    private void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    private MockHttpServletRequestBuilder withToken(MockHttpServletRequestBuilder request) {
        return request.header("Authorization", "Bearer " + token);
    }

    private void upload(String title, User owner, String publishedAt) {
        Video video = new Video(title, title, null, owner == null ? "Imported" : owner.getUsername(), 60, null, null,
                Instant.parse(publishedAt), title + ".mp4", title + ".webp");
        video.setUploader(owner);
        videoRepository.save(video);
    }

    @Test
    void subscribingPersistsAndCountsTheSubscriber() throws Exception {
        mockMvc.perform(withToken(put(BOB_CHANNEL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.channel").value("bob"))
                .andExpect(jsonPath("$.subscribed").value(true))
                .andExpect(jsonPath("$.subscribers").value(1));
        flushAndClear();

        mockMvc.perform(withToken(get(BOB_CHANNEL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(true))
                .andExpect(jsonPath("$.subscribers").value(1));
    }

    @Test
    void anonymousVisitorsSeeTheSubscribersButAreNotSubscribed() throws Exception {
        mockMvc.perform(withToken(put(BOB_CHANNEL))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(get(BOB_CHANNEL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(false))
                .andExpect(jsonPath("$.subscribers").value(1));
    }

    @Test
    void subscribingTwiceKeepsOneSubscription() throws Exception {
        mockMvc.perform(withToken(put(BOB_CHANNEL))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(withToken(put(BOB_CHANNEL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribers").value(1));
    }

    @Test
    void unsubscribingRemovesTheSubscription() throws Exception {
        mockMvc.perform(withToken(put(BOB_CHANNEL))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(withToken(delete(BOB_CHANNEL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(false))
                .andExpect(jsonPath("$.subscribers").value(0));
        flushAndClear();

        mockMvc.perform(withToken(get(BOB_CHANNEL)))
                .andExpect(jsonPath("$.subscribed").value(false));
    }

    @Test
    void unsubscribingWhenNotSubscribedChangesNothing() throws Exception {
        mockMvc.perform(withToken(delete(BOB_CHANNEL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(false))
                .andExpect(jsonPath("$.subscribers").value(0));
    }

    @Test
    void usersCannotSubscribeToTheirOwnChannel() throws Exception {
        mockMvc.perform(withToken(put("/api/channels/alice/subscription")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You cannot subscribe to your own channel"));
    }

    @Test
    void listsTheVideosOfTheSubscribedChannelsNewestFirst() throws Exception {
        upload("Bob old", bob, "2020-01-01T00:00:00Z");
        upload("Bob new", bob, "2024-01-01T00:00:00Z");
        upload("Carol video", carol, "2023-01-01T00:00:00Z");
        upload("Imported video", null, "2025-01-01T00:00:00Z");
        mockMvc.perform(withToken(put(BOB_CHANNEL))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(withToken(get("/api/subscriptions/videos")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].title").value("Bob new"))
                .andExpect(jsonPath("$.content[1].title").value("Bob old"))
                .andExpect(jsonPath("$.content[1].thumbnailUrl").value("/media/Bob old.webp"));
    }

    @Test
    void anEmptyListIsNotAnError() throws Exception {
        upload("Bob video", bob, "2024-01-01T00:00:00Z");
        flushAndClear();

        mockMvc.perform(withToken(get("/api/subscriptions/videos")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void rejectsAnInvalidPageSize() throws Exception {
        mockMvc.perform(withToken(get("/api/subscriptions/videos").param("size", "100")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.size").value("Size must be between 1 and 50"));
    }

    @Test
    void countsTheSubscribersOfTheLoggedInUser() throws Exception {
        mockMvc.perform(withToken(put(BOB_CHANNEL))).andExpect(status().isOk());
        token = jwtService.generateToken("carol");
        mockMvc.perform(withToken(put(BOB_CHANNEL))).andExpect(status().isOk());
        flushAndClear();

        token = jwtService.generateToken("bob");
        mockMvc.perform(withToken(get("/api/subscriptions/subscribers")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribers").value(2));
        token = jwtService.generateToken("alice");
        mockMvc.perform(withToken(get("/api/subscriptions/subscribers")))
                .andExpect(jsonPath("$.subscribers").value(0));
    }

    @Test
    void requiresALoggedInUserToChangeOrListSubscriptions() throws Exception {
        mockMvc.perform(put(BOB_CHANNEL)).andExpect(status().isUnauthorized());
        mockMvc.perform(delete(BOB_CHANNEL)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/subscriptions/videos")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/subscriptions/subscribers")).andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsATokenOfAUserThatNoLongerExists() throws Exception {
        token = jwtService.generateToken("ghost");

        mockMvc.perform(withToken(put(BOB_CHANNEL))).andExpect(status().isUnauthorized());
        mockMvc.perform(withToken(get("/api/subscriptions/videos"))).andExpect(status().isUnauthorized());
    }

    @Test
    void answersNotFoundForAnUnknownChannel() throws Exception {
        String unknown = "/api/channels/nobody/subscription";

        mockMvc.perform(get(unknown))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Channel nobody not found"));
        mockMvc.perform(withToken(put(unknown))).andExpect(status().isNotFound());
        mockMvc.perform(withToken(delete(unknown))).andExpect(status().isNotFound());
    }

    @Test
    void browsersOnAnotherOriginMaySubscribeAndUnsubscribe() throws Exception {
        // The frontend runs on another origin, so the browser asks first with a CORS preflight
        for (String method : new String[]{"PUT", "DELETE"}) {
            mockMvc.perform(options(BOB_CHANNEL)
                            .header("Origin", "http://localhost:5173")
                            .header("Access-Control-Request-Method", method)
                            .header("Access-Control-Request-Headers", "authorization"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Methods", containsString(method)));
        }
    }
}
