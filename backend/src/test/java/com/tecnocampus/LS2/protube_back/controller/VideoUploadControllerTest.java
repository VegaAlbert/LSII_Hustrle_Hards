package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.controller.dto.ErrorResponse;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.services.JwtService;
import com.tecnocampus.LS2.protube_back.services.VideoStorageException;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileSystemUtils;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Checks POST /api/videos (US-06) through the real security chain and the in-memory database. The uploaded files are
 * written to a temporary video store. Each test runs in a transaction that is rolled back.
 */
@SpringBootTest(properties = "pro_tube.load_initial_data=false")
@AutoConfigureMockMvc
@Transactional
class VideoUploadControllerTest {

    private static final Path STORE_DIR = createStoreDir();

    private static final String METADATA = """
            {"title": "My trip", "description": "Day one #travel", "tags": ["#Beach", "beach", "Road trip"],
             "category": "TRAVEL_AND_EVENTS", "ageRestricted": true, "durationSeconds": 95,
             "width": 1920, "height": 1080}
            """;

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserRepository userRepository;

    @Autowired
    JwtService jwtService;

    String token;

    @DynamicPropertySource
    static void storeDir(DynamicPropertyRegistry registry) {
        // Ends with a separator, as MvcConfig expects
        registry.add("pro_tube.store.dir", () -> STORE_DIR + File.separator);
    }

    private static Path createStoreDir() {
        try {
            return Files.createTempDirectory("protube-upload-test");
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    @AfterAll
    static void deleteStoreDir() throws IOException {
        FileSystemUtils.deleteRecursively(STORE_DIR);
    }

    @BeforeEach
    void setUp() {
        userRepository.save(new User("alice", "alice@example.com", "hash"));
        token = jwtService.generateToken("alice");
    }

    private static MockMultipartFile metadata(String json) {
        return new MockMultipartFile("metadata", "", MediaType.APPLICATION_JSON_VALUE, json.getBytes());
    }

    private static MockMultipartFile video() {
        return new MockMultipartFile("video", "trip.mp4", "video/mp4", new byte[]{1, 2, 3});
    }

    private static MockMultipartFile thumbnail() {
        return new MockMultipartFile("thumbnail", "frame.jpg", "image/jpeg", new byte[]{4, 5});
    }

    private MockMultipartHttpServletRequestBuilder upload() {
        return (MockMultipartHttpServletRequestBuilder) multipart("/api/videos")
                .header("Authorization", "Bearer " + token);
    }

    @Test
    void publishesTheVideoAndReturnsIt() throws Exception {
        String location = mockMvc.perform(upload().file(metadata(METADATA)).file(video()).file(thumbnail()))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/videos/")))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("My trip"))
                .andExpect(jsonPath("$.description").value("Day one #travel"))
                .andExpect(jsonPath("$.author").value("alice"))
                .andExpect(jsonPath("$.tags", hasSize(2)))
                .andExpect(jsonPath("$.tags[0]").value("Beach"))
                .andExpect(jsonPath("$.tags[1]").value("Road trip"))
                .andExpect(jsonPath("$.category").value("TRAVEL_AND_EVENTS"))
                .andExpect(jsonPath("$.ageRestricted").value(true))
                .andExpect(jsonPath("$.durationSeconds").value(95))
                .andExpect(jsonPath("$.videoUrl", endsWith(".mp4")))
                .andExpect(jsonPath("$.thumbnailUrl", endsWith("-thumbnail.jpg")))
                .andExpect(jsonPath("$.comments", hasSize(0)))
                .andReturn().getResponse().getHeader("Location");

        // It is now part of the catalog
        mockMvc.perform(get(location))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("My trip"));
        mockMvc.perform(get("/api/videos"))
                .andExpect(jsonPath("$.content[0].title").value("My trip"))
                .andExpect(jsonPath("$.content[0].ageRestricted").value(true));
    }

    @Test
    void rejectsAnonymousUsers() throws Exception {
        mockMvc.perform(multipart("/api/videos").file(metadata(METADATA)).file(video()).file(thumbnail()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsAnInvalidTitle() throws Exception {
        mockMvc.perform(upload().file(metadata("{\"title\": \"  \", \"durationSeconds\": 10}"))
                        .file(video()).file(thumbnail()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").value("Title is required"));
    }

    @Test
    void rejectsTooManyTags() throws Exception {
        String tags = "\"a\",".repeat(15) + "\"b\"";
        mockMvc.perform(upload().file(metadata("{\"title\": \"T\", \"tags\": [" + tags + "]}"))
                        .file(video()).file(thumbnail()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.tags").value("At most 15 tags"));
    }

    @Test
    void rejectsAnUnknownCategory() throws Exception {
        mockMvc.perform(upload().file(metadata("{\"title\": \"T\", \"category\": \"COOKING\"}"))
                        .file(video()).file(thumbnail()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsAnUnsupportedVideoFormat() throws Exception {
        MockMultipartFile avi = new MockMultipartFile("video", "a.avi", "video/x-msvideo", new byte[]{1});

        mockMvc.perform(upload().file(metadata(METADATA)).file(avi).file(thumbnail()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.video").value("The video must be an MP4 or WebM file"));
    }

    @Test
    void rejectsAnUploadWithoutVideo() throws Exception {
        mockMvc.perform(upload().file(metadata(METADATA)).file(thumbnail()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.video").value("The video is required"));
    }

    // MockMvc does not apply the multipart size limits, so the handlers are called directly
    @Test
    void mapsTooBigUploadsTo413() {
        ResponseEntity<ErrorResponse> response =
                new ApiExceptionHandler().handleUploadTooBig(new MaxUploadSizeExceededException(100));

        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.getStatusCode());
        assertEquals("The video must be at most 100 MB", response.getBody().fieldErrors().get("video"));
    }

    @Test
    void mapsStorageErrorsTo500() {
        ResponseEntity<ErrorResponse> response =
                new ApiExceptionHandler().handleVideoStorage(new VideoStorageException(new IOException("disk full")));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("Could not store the video. Please try again later.", response.getBody().message());
    }
}
