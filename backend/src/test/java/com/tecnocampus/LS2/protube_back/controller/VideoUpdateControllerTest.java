package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import com.tecnocampus.LS2.protube_back.services.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Checks PUT /api/videos/{id} (US-07) through the real security chain and the in-memory database.
 * Each test runs in a transaction that is rolled back.
 */
@SpringBootTest({
        "pro_tube.store.dir=c:",
        "pro_tube.load_initial_data=false"
})
@AutoConfigureMockMvc
@Transactional
class VideoUpdateControllerTest {

    private static final String CHANGES = """
            {"title": "New title", "description": "Now with #hashtags", "tags": ["#Beach", "sea"],
             "category": "TRAVEL_AND_EVENTS", "ageRestricted": true}
            """;

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserRepository userRepository;

    @Autowired
    VideoRepository videoRepository;

    @Autowired
    JwtService jwtService;

    Long aliceVideoId;
    Long importedVideoId;

    @BeforeEach
    void setUp() {
        User alice = userRepository.save(new User("alice", "alice@example.com", "hash"));
        userRepository.save(new User("bob", "bob@example.com", "hash"));

        Video owned = new Video("upload-1", "Old title", "Old description", "alice", 60, 1280, 720,
                Instant.ofEpochSecond(1700000000L), "upload-1.mp4", "upload-1-thumbnail.jpg");
        owned.setUploader(alice);
        aliceVideoId = videoRepository.save(owned).getId();

        importedVideoId = videoRepository.save(new Video("1", "Imported", null, "Channel", 60, 1280, 720,
                Instant.ofEpochSecond(1700000000L), "1.mp4", "1.webp")).getId();
    }

    private MockHttpServletRequestBuilder update(Long id, String username, String body) {
        return put("/api/videos/" + id)
                .header("Authorization", "Bearer " + jwtService.generateToken(username))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);
    }

    @Test
    void theOwnerChangesTheMetadataAndItIsShownOnTheDetail() throws Exception {
        mockMvc.perform(update(aliceVideoId, "alice", CHANGES))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New title"))
                .andExpect(jsonPath("$.uploader").value("alice"));

        mockMvc.perform(get("/api/videos/" + aliceVideoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New title"))
                .andExpect(jsonPath("$.description").value("Now with #hashtags"))
                .andExpect(jsonPath("$.tags", hasSize(2)))
                .andExpect(jsonPath("$.tags[0]").value("Beach"))
                .andExpect(jsonPath("$.category").value("TRAVEL_AND_EVENTS"))
                .andExpect(jsonPath("$.ageRestricted").value(true))
                // Duration, files and date are not editable
                .andExpect(jsonPath("$.durationSeconds").value(60))
                .andExpect(jsonPath("$.videoUrl").value("/media/upload-1.mp4"));
    }

    @Test
    void anotherUserCannotEditTheVideo() throws Exception {
        mockMvc.perform(update(aliceVideoId, "bob", CHANGES))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You can only edit your own videos (video " + aliceVideoId + ")"));

        mockMvc.perform(get("/api/videos/" + aliceVideoId))
                .andExpect(jsonPath("$.title").value("Old title"));
    }

    @Test
    void nobodyCanEditAnImportedVideo() throws Exception {
        mockMvc.perform(update(importedVideoId, "alice", CHANGES))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousVisitorsCannotEditVideos() throws Exception {
        mockMvc.perform(put("/api/videos/" + aliceVideoId).contentType(MediaType.APPLICATION_JSON).content(CHANGES))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsInvalidMetadata() throws Exception {
        mockMvc.perform(update(aliceVideoId, "alice", "{\"title\": \" \", \"description\": \"x\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").value("Title is required"));
    }

    @Test
    void answers404ForAVideoThatDoesNotExist() throws Exception {
        mockMvc.perform(update(999_999L, "alice", CHANGES))
                .andExpect(status().isNotFound());
    }

    // The dev frontend (another origin) asks the browser's CORS preflight before sending the PUT
    @Test
    void allowsTheCorsPreflightOfAnEditFromTheDevFrontend() throws Exception {
        mockMvc.perform(options("/api/videos/" + aliceVideoId)
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "PUT")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("PUT")));
    }

    @Test
    void theDetailShowsNoOwnerForImportedVideos() throws Exception {
        mockMvc.perform(get("/api/videos/" + importedVideoId))
                .andExpect(jsonPath("$.uploader").doesNotExist());
    }
}
