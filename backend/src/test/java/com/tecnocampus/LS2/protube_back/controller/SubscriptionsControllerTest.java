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
 * Checks the subscription routes (US-13) through the real security chain and the in-memory database. Channels are
 * video authors: an imported channel ("AC/DC") and the users bob and carol, who uploaded videos.
 * Each test runs in a transaction that is rolled back.
 */
@SpringBootTest({
        "pro_tube.store.dir=c:",
        "pro_tube.load_initial_data=false"
})
@AutoConfigureMockMvc
@Transactional
class SubscriptionsControllerTest {

    private static final String CHANNEL = "/api/subscriptions/channel";

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

    private MockHttpServletRequestBuilder channel(MockHttpServletRequestBuilder request, String name) {
        return request.param("name", name);
    }

    // An imported video (no uploader) from the channel "author"
    private void imported(String title, String author, String publishedAt) {
        videoRepository.save(new Video(title, title, null, author, 60, null, null, Instant.parse(publishedAt),
                title + ".mp4", title + ".webp"));
    }

    // A video uploaded by a user: as in VideoUploadService, the author is the username
    private void uploaded(String title, User owner, String publishedAt) {
        Video video = new Video(title, title, null, owner.getUsername(), 60, null, null, Instant.parse(publishedAt),
                title + ".mp4", title + ".webp");
        video.setUploader(owner);
        videoRepository.save(video);
    }

    @Test
    void subscribingToAnImportedChannelPersistsAndCountsTheSubscriber() throws Exception {
        imported("Thunderstruck", "AC/DC", "2020-01-01T00:00:00Z");
        flushAndClear();

        mockMvc.perform(withToken(channel(put(CHANNEL), "AC/DC")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.channel").value("AC/DC"))
                .andExpect(jsonPath("$.subscribed").value(true))
                .andExpect(jsonPath("$.subscribers").value(1));
        flushAndClear();

        mockMvc.perform(withToken(channel(get(CHANNEL), "AC/DC")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(true))
                .andExpect(jsonPath("$.subscribers").value(1));
    }

    @Test
    void usersCanBeFollowedEvenBeforeTheyUploadAnything() throws Exception {
        mockMvc.perform(withToken(channel(put(CHANNEL), "bob")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(true));
    }

    @Test
    void anonymousVisitorsSeeTheSubscribersButAreNotSubscribed() throws Exception {
        uploaded("Bob video", bob, "2024-01-01T00:00:00Z");
        mockMvc.perform(withToken(channel(put(CHANNEL), "bob"))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(channel(get(CHANNEL), "bob"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(false))
                .andExpect(jsonPath("$.subscribers").value(1));
    }

    @Test
    void subscribingTwiceKeepsOneSubscription() throws Exception {
        mockMvc.perform(withToken(channel(put(CHANNEL), "bob"))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(withToken(channel(put(CHANNEL), "bob")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribers").value(1));
    }

    @Test
    void unsubscribingRemovesTheSubscription() throws Exception {
        mockMvc.perform(withToken(channel(put(CHANNEL), "bob"))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(withToken(channel(delete(CHANNEL), "bob")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(false))
                .andExpect(jsonPath("$.subscribers").value(0));
        flushAndClear();

        mockMvc.perform(withToken(channel(get(CHANNEL), "bob")))
                .andExpect(jsonPath("$.subscribed").value(false));
    }

    @Test
    void unsubscribingWhenNotSubscribedChangesNothing() throws Exception {
        mockMvc.perform(withToken(channel(delete(CHANNEL), "bob")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(false))
                .andExpect(jsonPath("$.subscribers").value(0));
    }

    @Test
    void usersCannotSubscribeToTheirOwnChannel() throws Exception {
        mockMvc.perform(withToken(channel(put(CHANNEL), "alice")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You cannot subscribe to your own channel"));
    }

    @Test
    void listsTheVideosOfTheSubscribedChannelsNewestFirst() throws Exception {
        uploaded("Bob old", bob, "2020-01-01T00:00:00Z");
        uploaded("Bob new", bob, "2024-01-01T00:00:00Z");
        uploaded("Carol video", carol, "2023-01-01T00:00:00Z");
        imported("Thunderstruck", "AC/DC", "2022-01-01T00:00:00Z");
        imported("Other band", "Queen", "2025-01-01T00:00:00Z");
        mockMvc.perform(withToken(channel(put(CHANNEL), "bob"))).andExpect(status().isOk());
        mockMvc.perform(withToken(channel(put(CHANNEL), "AC/DC"))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(withToken(get("/api/subscriptions/videos")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].title").value("Bob new"))
                .andExpect(jsonPath("$.content[1].title").value("Thunderstruck"))
                .andExpect(jsonPath("$.content[2].title").value("Bob old"))
                .andExpect(jsonPath("$.content[2].thumbnailUrl").value("/media/Bob old.webp"));
    }

    @Test
    void anEmptyListIsNotAnError() throws Exception {
        uploaded("Bob video", bob, "2024-01-01T00:00:00Z");
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
        uploaded("Bob video", bob, "2024-01-01T00:00:00Z");
        mockMvc.perform(withToken(channel(put(CHANNEL), "bob"))).andExpect(status().isOk());
        token = jwtService.generateToken("carol");
        mockMvc.perform(withToken(channel(put(CHANNEL), "bob"))).andExpect(status().isOk());
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
        mockMvc.perform(channel(put(CHANNEL), "bob")).andExpect(status().isUnauthorized());
        mockMvc.perform(channel(delete(CHANNEL), "bob")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/subscriptions/videos")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/subscriptions/subscribers")).andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsATokenOfAUserThatNoLongerExists() throws Exception {
        token = jwtService.generateToken("ghost");

        mockMvc.perform(withToken(channel(put(CHANNEL), "bob"))).andExpect(status().isUnauthorized());
        mockMvc.perform(withToken(get("/api/subscriptions/videos"))).andExpect(status().isUnauthorized());
    }

    @Test
    void answersNotFoundForAnUnknownChannel() throws Exception {
        mockMvc.perform(channel(get(CHANNEL), "nobody"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Channel nobody not found"));
        mockMvc.perform(withToken(channel(put(CHANNEL), "nobody"))).andExpect(status().isNotFound());
        mockMvc.perform(withToken(channel(delete(CHANNEL), "nobody"))).andExpect(status().isNotFound());
    }

    @Test
    void answersBadRequestWithoutAChannelName() throws Exception {
        mockMvc.perform(get(CHANNEL)).andExpect(status().isBadRequest());
    }

    @Test
    void browsersOnAnotherOriginMaySubscribeAndUnsubscribe() throws Exception {
        // The frontend runs on another origin, so the browser asks first with a CORS preflight
        for (String method : new String[]{"PUT", "DELETE"}) {
            mockMvc.perform(options(CHANNEL)
                            .param("name", "bob")
                            .header("Origin", "http://localhost:5173")
                            .header("Access-Control-Request-Method", method)
                            .header("Access-Control-Request-Headers", "authorization"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Methods", containsString(method)));
        }
    }
}
