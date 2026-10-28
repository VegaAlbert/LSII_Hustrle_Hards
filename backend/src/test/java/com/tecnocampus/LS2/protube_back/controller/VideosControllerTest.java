package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.domain.Comment;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Checks GET /api/videos through the real security chain and the in-memory database.
 * Each test runs in a transaction that is rolled back.
 */
@SpringBootTest({
        "pro_tube.store.dir=c:",
        "pro_tube.load_initial_data=false"
})
@AutoConfigureMockMvc
@Transactional
class VideosControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    VideoRepository videoRepository;

    @Autowired
    EntityManager entityManager;

    @BeforeEach
    void setUp() {
        // Saved out of order: video N is published N days after video 0
        for (int n : new int[]{2, 0, 4, 1, 3}) {
            videoRepository.save(new Video(String.valueOf(n), "Video " + n, "Description", "Author " + n, 60 + n,
                    1280, 720, Instant.ofEpochSecond(1700000000L + n * 86400L), n + ".mp4", n + ".webp"));
        }
    }

    @Test
    void returnsTheFirstPageNewestFirst() throws Exception {
        mockMvc.perform(get("/api/videos").param("page", "0").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].title").value("Video 4"))
                .andExpect(jsonPath("$.content[0].author").value("Author 4"))
                .andExpect(jsonPath("$.content[0].durationSeconds").value(64))
                .andExpect(jsonPath("$.content[0].thumbnailUrl").value("/media/4.webp"))
                .andExpect(jsonPath("$.content[0].id").isNumber())
                .andExpect(jsonPath("$.content[1].title").value("Video 3"))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3));
    }

    @Test
    void returnsTheLastPartialPage() throws Exception {
        mockMvc.perform(get("/api/videos").param("page", "2").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Video 0"));
    }

    @Test
    void usesTwelveVideosPerPageByDefault() throws Exception {
        mockMvc.perform(get("/api/videos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(12))
                .andExpect(jsonPath("$.content", hasSize(5)));
    }

    @Test
    void doesNotExposeEntityFields() throws Exception {
        mockMvc.perform(get("/api/videos"))
                .andExpect(jsonPath("$.content[0].storeId").doesNotExist())
                .andExpect(jsonPath("$.content[0].videoFile").doesNotExist());
    }

    @Test
    void rejectsNegativePage() throws Exception {
        mockMvc.perform(get("/api/videos").param("page", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.page").value("Page must be 0 or greater"));
    }

    @Test
    void rejectsZeroSize() throws Exception {
        mockMvc.perform(get("/api/videos").param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.size").value("Size must be between 1 and 50"));
    }

    @Test
    void rejectsSizeAboveFifty() throws Exception {
        mockMvc.perform(get("/api/videos").param("size", "51"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.size").value("Size must be between 1 and 50"));
    }

    @Test
    void rejectsNonNumericPage() throws Exception {
        mockMvc.perform(get("/api/videos").param("page", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.page").value("Invalid value"));
    }

    @Test
    void returnsTheDetailOfAVideoWithItsCommentsNewestFirst() throws Exception {
        Video video = new Video("10", "Detail", "Long description", "Channel", 75, 1920, 1080,
                Instant.ofEpochSecond(1700000000L), "10.mp4", "10.webp");
        video.addComment(new Comment("ann", "Older", 1, Instant.ofEpochSecond(1700000100L)));
        video.addComment(new Comment("bob", "Newer", 5, Instant.ofEpochSecond(1700000200L)));
        Long id = videoRepository.saveAndFlush(video).getId();
        // Read from the database again, as a real request would, so @OrderBy is applied
        entityManager.clear();

        mockMvc.perform(get("/api/videos/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.title").value("Detail"))
                .andExpect(jsonPath("$.description").value("Long description"))
                .andExpect(jsonPath("$.author").value("Channel"))
                .andExpect(jsonPath("$.durationSeconds").value(75))
                .andExpect(jsonPath("$.videoUrl").value("/media/10.mp4"))
                .andExpect(jsonPath("$.thumbnailUrl").value("/media/10.webp"))
                // ISO-8601 string, not a number, so the frontend can parse it with new Date()
                .andExpect(jsonPath("$.publishedAt").value("2023-11-14T22:13:20Z"))
                .andExpect(jsonPath("$.comments[0].publishedAt").value("2023-11-14T22:16:40Z"))
                .andExpect(jsonPath("$.comments", hasSize(2)))
                .andExpect(jsonPath("$.comments[0].author").value("bob"))
                .andExpect(jsonPath("$.comments[0].text").value("Newer"))
                .andExpect(jsonPath("$.comments[0].likeCount").value(5))
                .andExpect(jsonPath("$.comments[1].text").value("Older"))
                .andExpect(jsonPath("$.storeId").doesNotExist())
                .andExpect(jsonPath("$.videoFile").doesNotExist());
    }

    @Test
    void answersNotFoundForAnUnknownVideo() throws Exception {
        mockMvc.perform(get("/api/videos/{id}", 999999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Video 999999 not found"));
    }

    @Test
    void rejectsANonNumericVideoId() throws Exception {
        mockMvc.perform(get("/api/videos/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.id").value("Invalid value"));
    }
}
