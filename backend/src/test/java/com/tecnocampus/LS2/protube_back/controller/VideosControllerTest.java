package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
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
}
