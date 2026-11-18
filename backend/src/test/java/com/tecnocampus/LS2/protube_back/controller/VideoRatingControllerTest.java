package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.RatingRepository;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import com.tecnocampus.LS2.protube_back.services.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Checks GET and PUT /api/videos/{id}/rating (video ratings) through the real security chain and the in-memory
 * database. Each test runs in a transaction that is rolled back.
 */
@SpringBootTest({
        "pro_tube.store.dir=c:",
        "pro_tube.load_initial_data=false"
})
@AutoConfigureMockMvc
@Transactional
class VideoRatingControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserRepository userRepository;

    @Autowired
    VideoRepository videoRepository;

    @Autowired
    RatingRepository ratingRepository;

    @Autowired
    JwtService jwtService;

    Long videoId;

    @BeforeEach
    void setUp() {
        userRepository.save(new User("alice", "alice@example.com", "hash"));
        userRepository.save(new User("bob", "bob@example.com", "hash"));
        userRepository.save(new User("carol", "carol@example.com", "hash"));
        videoId = videoRepository.save(new Video("1", "Uptown Funk", null, "Mark Ronson", 79, null, null,
                Instant.parse("2014-11-19T13:20:18Z"), "1.mp4", "1.webp")).getId();
    }

    private MockHttpServletRequestBuilder rate(Long id, String username, String body) {
        return put("/api/videos/" + id + "/rating")
                .header("Authorization", "Bearer " + jwtService.generateToken(username))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);
    }

    private static String score(int stars) {
        return "{\"score\": " + stars + "}";
    }

    @Test
    void aLoggedInUserRatesAVideoAndTheAverageIsUpdated() throws Exception {
        mockMvc.perform(rate(videoId, "alice", score(4)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.average").value(4.0))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.myScore").value(4));

        // Persisted: anybody reading the video afterwards sees it
        mockMvc.perform(get("/api/videos/" + videoId + "/rating"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.average").value(4.0))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.myScore").doesNotExist());
    }

    @Test
    void ratingAgainChangesThePreviousRatingWithoutDuplicatingIt() throws Exception {
        mockMvc.perform(rate(videoId, "alice", score(2))).andExpect(status().isOk());

        mockMvc.perform(rate(videoId, "alice", score(5)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.average").value(5.0))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.myScore").value(5));

        assertEquals(1, ratingRepository.count());
    }

    @Test
    void theAverageCombinesTheRatingsOfSeveralUsers() throws Exception {
        mockMvc.perform(rate(videoId, "alice", score(5))).andExpect(status().isOk());
        mockMvc.perform(rate(videoId, "bob", score(4))).andExpect(status().isOk());
        mockMvc.perform(rate(videoId, "carol", score(4))).andExpect(status().isOk());

        // (5 + 4 + 4) / 3 = 4.333 -> 4.3; each user sees their own score
        mockMvc.perform(get("/api/videos/" + videoId + "/rating")
                        .header("Authorization", "Bearer " + jwtService.generateToken("alice")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.average").value(4.3))
                .andExpect(jsonPath("$.count").value(3))
                .andExpect(jsonPath("$.myScore").value(5));
        mockMvc.perform(get("/api/videos/" + videoId + "/rating")
                        .header("Authorization", "Bearer " + jwtService.generateToken("bob")))
                .andExpect(jsonPath("$.myScore").value(4));
    }

    @Test
    void aVideoWithoutRatingsHasNoAverage() throws Exception {
        mockMvc.perform(get("/api/videos/" + videoId + "/rating"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.average").doesNotExist())
                .andExpect(jsonPath("$.count").value(0))
                .andExpect(jsonPath("$.myScore").doesNotExist());
    }

    @Test
    void anonymousVisitorsCannotRate() throws Exception {
        mockMvc.perform(put("/api/videos/" + videoId + "/rating")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(score(5)))
                .andExpect(status().isUnauthorized());

        assertEquals(0, ratingRepository.count());
    }

    @Test
    void aUserCannotRateOnBehalfOfSomeoneElse() throws Exception {
        // The body has no user: an extra field naming another user is ignored and the rating belongs to the token
        mockMvc.perform(rate(videoId, "bob", "{\"score\": 1, \"username\": \"alice\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/videos/" + videoId + "/rating")
                        .header("Authorization", "Bearer " + jwtService.generateToken("alice")))
                .andExpect(jsonPath("$.myScore").doesNotExist());
        mockMvc.perform(get("/api/videos/" + videoId + "/rating")
                        .header("Authorization", "Bearer " + jwtService.generateToken("bob")))
                .andExpect(jsonPath("$.myScore").value(1));
    }

    @ParameterizedTest
    // Single-digit values, so only the range rule fails (100 would also break @Digits and the message would vary)
    @ValueSource(strings = {"0", "6", "-1", "9"})
    void rejectsScoresOutOfRange(String value) throws Exception {
        mockMvc.perform(rate(videoId, "alice", "{\"score\": " + value + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.score").value("Score must be between 1 and 5"));

        assertEquals(0, ratingRepository.count());
    }

    @Test
    void rejectsScoresThatAreNotAWholeNumberOfStars() throws Exception {
        mockMvc.perform(rate(videoId, "alice", "{\"score\": 4.5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.score").value("Score must be a whole number of stars"));
    }

    @Test
    void rejectsAMissingScore() throws Exception {
        mockMvc.perform(rate(videoId, "alice", "{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.score").value("Score is required"));
    }

    @Test
    void rejectsAScoreThatIsNotANumber() throws Exception {
        mockMvc.perform(rate(videoId, "alice", "{\"score\": \"five\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsTheTokenOfAUserThatNoLongerExists() throws Exception {
        mockMvc.perform(rate(videoId, "ghost", score(3)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void answers404ForAVideoThatDoesNotExist() throws Exception {
        mockMvc.perform(rate(999_999L, "alice", score(3)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/videos/999999/rating"))
                .andExpect(status().isNotFound());
    }
}
