package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.domain.Comment;
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
 * Checks GET /api/analytics and POST /api/videos/{id}/views (US-11) through the real security chain and the
 * in-memory database. Each test runs in a transaction that is rolled back.
 */
@SpringBootTest({
        "pro_tube.store.dir=c:",
        "pro_tube.load_initial_data=false"
})
@AutoConfigureMockMvc
@Transactional
class AnalyticsControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserRepository userRepository;

    @Autowired
    VideoRepository videoRepository;

    @Autowired
    JwtService jwtService;

    Long aliceOlderVideoId;
    Long aliceNewerVideoId;
    Long carolVideoId;

    @BeforeEach
    void setUp() {
        User alice = userRepository.save(new User("alice", "alice@example.com", "hash"));
        userRepository.save(new User("bob", "bob@example.com", "hash"));
        User carol = userRepository.save(new User("carol", "carol@example.com", "hash"));

        Video older = video("upload-1", "Older video", "2026-11-01T10:00:00Z", alice);
        older.addComment(new Comment("bob", "Nice", 4, Instant.parse("2026-11-02T10:00:00Z")));
        older.addComment(new Comment("carol", "Great", 1, Instant.parse("2026-11-03T10:00:00Z")));
        aliceOlderVideoId = videoRepository.save(older).getId();
        aliceNewerVideoId = videoRepository.save(video("upload-2", "Newer video", "2026-11-10T10:00:00Z", alice))
                .getId();

        Video carols = video("upload-3", "Carol's video", "2026-11-05T10:00:00Z", carol);
        carols.addComment(new Comment("alice", "Cool", 9, Instant.parse("2026-11-06T10:00:00Z")));
        carolVideoId = videoRepository.save(carols).getId();

        // Imported videos have no uploader: they never appear in anybody's analytics
        videoRepository.save(new Video("1", "Imported", null, "Channel", 60, null, null,
                Instant.parse("2026-11-01T10:00:00Z"), "1.mp4", "1.webp"));
    }

    private static Video video(String storeId, String title, String publishedAt, User uploader) {
        Video video = new Video(storeId, title, null, uploader.getUsername(), 60, null, null,
                Instant.parse(publishedAt), storeId + ".mp4", storeId + "-thumbnail.jpg");
        video.setUploader(uploader);
        return video;
    }

    private MockHttpServletRequestBuilder asUser(MockHttpServletRequestBuilder request, String username) {
        return request.header("Authorization", "Bearer " + jwtService.generateToken(username));
    }

    private void view(Long videoId, String username) throws Exception {
        MockHttpServletRequestBuilder request = post("/api/videos/" + videoId + "/views");
        mockMvc.perform(username == null ? request : asUser(request, username)).andExpect(status().isNoContent());
    }

    @Test
    void theUserSeesTheTotalsAndEachOfTheirVideos() throws Exception {
        view(aliceOlderVideoId, null);
        view(aliceOlderVideoId, null);
        view(aliceOlderVideoId, "bob");
        view(aliceNewerVideoId, "alice");

        mockMvc.perform(asUser(get("/api/analytics"), "alice"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalVideos").value(2))
                .andExpect(jsonPath("$.totalViews").value(4))
                .andExpect(jsonPath("$.authenticatedViews").value(2))
                .andExpect(jsonPath("$.anonymousViews").value(2))
                .andExpect(jsonPath("$.totalComments").value(2))
                .andExpect(jsonPath("$.totalCommentLikes").value(5))
                // Newest first
                .andExpect(jsonPath("$.videos", hasSize(2)))
                .andExpect(jsonPath("$.videos[0].title").value("Newer video"))
                .andExpect(jsonPath("$.videos[0].views").value(1))
                .andExpect(jsonPath("$.videos[0].comments").value(0))
                .andExpect(jsonPath("$.videos[1].title").value("Older video"))
                .andExpect(jsonPath("$.videos[1].thumbnailUrl").value("/media/upload-1-thumbnail.jpg"))
                .andExpect(jsonPath("$.videos[1].views").value(3))
                .andExpect(jsonPath("$.videos[1].authenticatedViews").value(1))
                .andExpect(jsonPath("$.videos[1].anonymousViews").value(2))
                .andExpect(jsonPath("$.videos[1].comments").value(2))
                .andExpect(jsonPath("$.videos[1].commentLikes").value(5))
                // The views just recorded are dated today, the last day of the chart
                .andExpect(jsonPath("$.dailyViews", hasSize(30)))
                .andExpect(jsonPath("$.dailyViews[29].views").value(4));
    }

    @Test
    void aUserWithoutVideosGetsAnEmptyAnalyticsInsteadOfAnError() throws Exception {
        mockMvc.perform(asUser(get("/api/analytics"), "bob"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalVideos").value(0))
                .andExpect(jsonPath("$.totalViews").value(0))
                .andExpect(jsonPath("$.videos", hasSize(0)))
                .andExpect(jsonPath("$.dailyViews", hasSize(0)));
    }

    @Test
    void eachUserOnlySeesTheirOwnVideos() throws Exception {
        view(carolVideoId, "alice");

        mockMvc.perform(asUser(get("/api/analytics"), "carol"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalVideos").value(1))
                .andExpect(jsonPath("$.videos[0].id").value(carolVideoId))
                .andExpect(jsonPath("$.totalViews").value(1))
                .andExpect(jsonPath("$.totalCommentLikes").value(9));

        // Alice's analytics do not include Carol's video nor its views and comments
        mockMvc.perform(asUser(get("/api/analytics"), "alice"))
                .andExpect(jsonPath("$.totalViews").value(0))
                .andExpect(jsonPath("$.totalComments").value(2))
                .andExpect(jsonPath("$.videos[?(@.id == " + carolVideoId + ")]").isEmpty());
    }

    @Test
    void anotherUserCannotBeChosenWithAParameter() throws Exception {
        // There is no user parameter: anything sent is ignored and the user always comes from the token
        mockMvc.perform(asUser(get("/api/analytics").param("username", "alice"), "bob"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalVideos").value(0));
    }

    @Test
    void anonymousVisitorsCannotSeeAnalytics() throws Exception {
        mockMvc.perform(get("/api/analytics"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsAnInvalidToken() throws Exception {
        mockMvc.perform(get("/api/analytics").header("Authorization", "Bearer not-a-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsTheTokenOfAUserThatNoLongerExists() throws Exception {
        mockMvc.perform(asUser(get("/api/analytics"), "ghost"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void doesNotCountViewsOfVideosThatDoNotExist() throws Exception {
        mockMvc.perform(post("/api/videos/999999/views"))
                .andExpect(status().isNotFound());
    }
}
