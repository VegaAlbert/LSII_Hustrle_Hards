package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.domain.Comment;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Checks POST /api/videos/{id}/comments (US-09) through the real security chain and the in-memory database.
 * Each test runs in a transaction that is rolled back.
 */
@SpringBootTest({
        "pro_tube.store.dir=c:",
        "pro_tube.load_initial_data=false"
})
@AutoConfigureMockMvc
@Transactional
class VideoCommentsControllerTest {

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

    Long videoId;
    String token;

    @BeforeEach
    void setUp() {
        Video video = new Video("abc", "Uptown Funk", null, "Mark Ronson", 79, null, null,
                Instant.parse("2014-11-19T13:20:18Z"), "0.mp4", "0.webp");
        video.addComment(new Comment("bob", "Old comment", 2, Instant.parse("2020-01-01T00:00:00Z")));
        videoId = videoRepository.save(video).getId();
        userRepository.save(new User("alice", "alice@example.com", "hash"));
        token = jwtService.generateToken("alice");
        // Later reads come from the database, not from the objects created here
        entityManager.flush();
        entityManager.clear();
    }

    private MockHttpServletRequestBuilder comment(Long id, String json) {
        return post("/api/videos/" + id + "/comments")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json);
    }

    @Test
    void persistsTheCommentAndShowsItFirstOnTheVideo() throws Exception {
        mockMvc.perform(comment(videoId, "{\"text\": \"  Great song!  \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.author").value("alice"))
                .andExpect(jsonPath("$.text").value("Great song!"))
                .andExpect(jsonPath("$.likeCount").value(0))
                .andExpect(jsonPath("$.publishedAt").isNotEmpty());

        entityManager.flush();
        entityManager.clear();

        mockMvc.perform(get("/api/videos/" + videoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comments", hasSize(2)))
                .andExpect(jsonPath("$.comments[0].author").value("alice"))
                .andExpect(jsonPath("$.comments[0].text").value("Great song!"))
                .andExpect(jsonPath("$.comments[1].text").value("Old comment"));
    }

    @Test
    void rejectsABlankComment() throws Exception {
        mockMvc.perform(comment(videoId, "{\"text\": \"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.text").value("Comment is required"));
    }

    @Test
    void rejectsAMissingText() throws Exception {
        mockMvc.perform(comment(videoId, "{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.text").value("Comment is required"));
    }

    @Test
    void rejectsATooLongComment() throws Exception {
        String text = "a".repeat(1001);

        mockMvc.perform(comment(videoId, "{\"text\": \"" + text + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.text").value("Comment must be at most 1000 characters"));
    }

    @Test
    void requiresALoggedInUser() throws Exception {
        mockMvc.perform(post("/api/videos/" + videoId + "/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\": \"Hi\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsATokenOfAUserThatNoLongerExists() throws Exception {
        token = jwtService.generateToken("ghost");

        mockMvc.perform(comment(videoId, "{\"text\": \"Hi\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void answersNotFoundForAnUnknownVideo() throws Exception {
        mockMvc.perform(comment(videoId + 1000, "{\"text\": \"Hi\"}"))
                .andExpect(status().isNotFound());
    }
}
