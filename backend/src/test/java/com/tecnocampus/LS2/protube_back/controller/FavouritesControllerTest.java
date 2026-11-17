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
 * Checks /api/favourites (US-12) through the real security chain and the in-memory database.
 * Each test runs in a transaction that is rolled back.
 */
@SpringBootTest({
        "pro_tube.store.dir=c:",
        "pro_tube.load_initial_data=false"
})
@AutoConfigureMockMvc
@Transactional
class FavouritesControllerTest {

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

    Long funkId;
    Long wallsId;
    String token;

    @BeforeEach
    void setUp() {
        funkId = videoRepository.save(new Video("abc", "Uptown Funk", null, "Mark Ronson", 79, null, null,
                Instant.parse("2014-11-19T13:20:18Z"), "0.mp4", "0.webp")).getId();
        wallsId = videoRepository.save(new Video("def", "City Walls", null, "Twenty One Pilots", 90, null, null,
                Instant.parse("2018-01-01T00:00:00Z"), "1.mp4", "1.webp")).getId();
        userRepository.save(new User("alice", "alice@example.com", "hash"));
        userRepository.save(new User("bob", "bob@example.com", "hash"));
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

    @Test
    void savedFavouritesPersistAndAreListedLastSavedFirst() throws Exception {
        mockMvc.perform(withToken(put("/api/favourites/" + funkId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.videoId").value(funkId))
                .andExpect(jsonPath("$.favourite").value(true));
        mockMvc.perform(withToken(put("/api/favourites/" + wallsId))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(withToken(get("/api/favourites/" + funkId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favourite").value(true));
        mockMvc.perform(withToken(get("/api/favourites")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].title").value("City Walls"))
                .andExpect(jsonPath("$.content[1].title").value("Uptown Funk"))
                .andExpect(jsonPath("$.content[1].thumbnailUrl").value("/media/0.webp"));
    }

    @Test
    void savingTwiceKeepsOneFavourite() throws Exception {
        mockMvc.perform(withToken(put("/api/favourites/" + funkId))).andExpect(status().isOk());
        flushAndClear();
        mockMvc.perform(withToken(put("/api/favourites/" + funkId))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(withToken(get("/api/favourites")))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void removingAFavouriteTakesItOffTheList() throws Exception {
        mockMvc.perform(withToken(put("/api/favourites/" + funkId))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(withToken(delete("/api/favourites/" + funkId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favourite").value(false));
        flushAndClear();

        mockMvc.perform(withToken(get("/api/favourites/" + funkId)))
                .andExpect(jsonPath("$.favourite").value(false));
        mockMvc.perform(withToken(get("/api/favourites")))
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    void removingAVideoThatIsNotAFavouriteChangesNothing() throws Exception {
        mockMvc.perform(withToken(delete("/api/favourites/" + funkId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favourite").value(false));
    }

    @Test
    void eachUserOnlySeesTheirOwnFavourites() throws Exception {
        mockMvc.perform(withToken(put("/api/favourites/" + funkId))).andExpect(status().isOk());
        flushAndClear();
        token = jwtService.generateToken("bob");

        mockMvc.perform(withToken(get("/api/favourites")))
                .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(withToken(get("/api/favourites/" + funkId)))
                .andExpect(jsonPath("$.favourite").value(false));
    }

    @Test
    void anEmptyListIsNotAnError() throws Exception {
        mockMvc.perform(withToken(get("/api/favourites")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void rejectsAnInvalidPageSize() throws Exception {
        mockMvc.perform(withToken(get("/api/favourites").param("size", "100")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.size").value("Size must be between 1 and 50"));
    }

    @Test
    void requiresALoggedInUser() throws Exception {
        mockMvc.perform(get("/api/favourites")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/favourites/" + funkId)).andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/favourites/" + funkId)).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/favourites/" + funkId)).andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsATokenOfAUserThatNoLongerExists() throws Exception {
        token = jwtService.generateToken("ghost");

        mockMvc.perform(withToken(put("/api/favourites/" + funkId))).andExpect(status().isUnauthorized());
        mockMvc.perform(withToken(get("/api/favourites"))).andExpect(status().isUnauthorized());
    }

    @Test
    void answersNotFoundForAnUnknownVideo() throws Exception {
        Long unknown = wallsId + 1000;

        mockMvc.perform(withToken(put("/api/favourites/" + unknown))).andExpect(status().isNotFound());
        mockMvc.perform(withToken(delete("/api/favourites/" + unknown))).andExpect(status().isNotFound());
        mockMvc.perform(withToken(get("/api/favourites/" + unknown))).andExpect(status().isNotFound());
    }

    @Test
    void browsersOnAnotherOriginMaySaveAndRemove() throws Exception {
        // The frontend runs on another origin, so the browser asks first with a CORS preflight
        for (String method : new String[]{"PUT", "DELETE"}) {
            mockMvc.perform(options("/api/favourites/" + funkId)
                            .header("Origin", "http://localhost:5173")
                            .header("Access-Control-Request-Method", method)
                            .header("Access-Control-Request-Headers", "authorization"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Methods", containsString(method)));
        }
    }
}
