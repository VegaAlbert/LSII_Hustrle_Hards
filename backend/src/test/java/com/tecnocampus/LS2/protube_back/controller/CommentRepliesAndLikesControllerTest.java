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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Checks the replies and likes of comments (US-10) through the real security chain and the in-memory database.
 * Each test runs in a transaction that is rolled back.
 */
@SpringBootTest({
        "pro_tube.store.dir=c:",
        "pro_tube.load_initial_data=false"
})
@AutoConfigureMockMvc
@Transactional
class CommentRepliesAndLikesControllerTest {

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
    Long otherVideoId;
    Long commentId;
    String token;

    @BeforeEach
    void setUp() {
        Video video = new Video("abc", "Uptown Funk", null, "Mark Ronson", 79, null, null,
                Instant.parse("2014-11-19T13:20:18Z"), "0.mp4", "0.webp");
        Comment comment = new Comment("bob", "Great song", 2, Instant.parse("2020-01-01T00:00:00Z"));
        video.addComment(comment);
        videoId = videoRepository.save(video).getId();
        commentId = comment.getId();
        otherVideoId = videoRepository.save(new Video("def", "Other", null, "Someone", 10, null, null,
                Instant.parse("2015-01-01T00:00:00Z"), "1.mp4", "1.webp")).getId();
        userRepository.save(new User("alice", "alice@example.com", "hash"));
        token = jwtService.generateToken("alice");
        // Later reads come from the database, not from the objects created here
        flushAndClear();
    }

    private void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    private MockHttpServletRequestBuilder reply(Long video, Long comment, String json) {
        return post("/api/videos/" + video + "/comments/" + comment + "/replies")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json);
    }

    private MockHttpServletRequestBuilder withToken(MockHttpServletRequestBuilder request) {
        return request.header("Authorization", "Bearer " + token);
    }

    private String likePath(Long video, Long comment) {
        return "/api/videos/" + video + "/comments/" + comment + "/like";
    }

    // ===== Replies =====

    @Test
    void persistsTheReplyAndShowsItNestedUnderTheComment() throws Exception {
        mockMvc.perform(reply(videoId, commentId, "{\"text\": \"  Agree!  \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.author").value("alice"))
                .andExpect(jsonPath("$.text").value("Agree!"))
                .andExpect(jsonPath("$.likeCount").value(0))
                .andExpect(jsonPath("$.likedByMe").value(false))
                .andExpect(jsonPath("$.replies", hasSize(0)));

        flushAndClear();

        mockMvc.perform(get("/api/videos/" + videoId))
                .andExpect(status().isOk())
                // The reply is not a top-level comment
                .andExpect(jsonPath("$.comments", hasSize(1)))
                .andExpect(jsonPath("$.comments[0].text").value("Great song"))
                .andExpect(jsonPath("$.comments[0].replies", hasSize(1)))
                .andExpect(jsonPath("$.comments[0].replies[0].author").value("alice"))
                .andExpect(jsonPath("$.comments[0].replies[0].text").value("Agree!"));
    }

    @Test
    void attachesAReplyToAReplyToTheTopLevelComment() throws Exception {
        String body = mockMvc.perform(reply(videoId, commentId, "{\"text\": \"First\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long replyId = Long.valueOf(body.replaceAll(".*\"id\":(\\d+).*", "$1"));
        flushAndClear();

        mockMvc.perform(reply(videoId, replyId, "{\"text\": \"Second\"}"))
                .andExpect(status().isCreated());
        flushAndClear();

        mockMvc.perform(get("/api/videos/" + videoId))
                .andExpect(jsonPath("$.comments", hasSize(1)))
                .andExpect(jsonPath("$.comments[0].replies", hasSize(2)))
                // Oldest first, so the conversation reads from top to bottom
                .andExpect(jsonPath("$.comments[0].replies[0].text").value("First"))
                .andExpect(jsonPath("$.comments[0].replies[1].text").value("Second"));
    }

    @Test
    void rejectsABlankReply() throws Exception {
        mockMvc.perform(reply(videoId, commentId, "{\"text\": \"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.text").value("Comment is required"));
    }

    @Test
    void rejectsATooLongReply() throws Exception {
        mockMvc.perform(reply(videoId, commentId, "{\"text\": \"" + "a".repeat(1001) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.text").value("Comment must be at most 1000 characters"));
    }

    @Test
    void replyRequiresALoggedInUser() throws Exception {
        mockMvc.perform(post("/api/videos/" + videoId + "/comments/" + commentId + "/replies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\": \"Hi\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void replyRejectsATokenOfAUserThatNoLongerExists() throws Exception {
        token = jwtService.generateToken("ghost");

        mockMvc.perform(reply(videoId, commentId, "{\"text\": \"Hi\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void replyAnswersNotFoundForAnUnknownVideoOrComment() throws Exception {
        mockMvc.perform(reply(videoId + 1000, commentId, "{\"text\": \"Hi\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(reply(videoId, commentId + 1000, "{\"text\": \"Hi\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Comment " + (commentId + 1000) + " not found"));
        // The comment exists, but on another video
        mockMvc.perform(reply(otherVideoId, commentId, "{\"text\": \"Hi\"}"))
                .andExpect(status().isNotFound());
    }

    // ===== Likes =====

    @Test
    void likeIncrementsTheCountAndMarksTheCommentAsLiked() throws Exception {
        mockMvc.perform(withToken(put(likePath(videoId, commentId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(3))
                .andExpect(jsonPath("$.liked").value(true));
        flushAndClear();

        mockMvc.perform(withToken(get("/api/videos/" + videoId)))
                .andExpect(jsonPath("$.comments[0].likeCount").value(3))
                .andExpect(jsonPath("$.comments[0].likedByMe").value(true));
        // Anonymous visitors see the count but like nothing
        mockMvc.perform(get("/api/videos/" + videoId))
                .andExpect(jsonPath("$.comments[0].likeCount").value(3))
                .andExpect(jsonPath("$.comments[0].likedByMe").value(false));
    }

    @Test
    void likingTwiceCountsOnce() throws Exception {
        mockMvc.perform(withToken(put(likePath(videoId, commentId)))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(withToken(put(likePath(videoId, commentId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(3))
                .andExpect(jsonPath("$.liked").value(true));
    }

    @Test
    void unlikeDecrementsTheCount() throws Exception {
        mockMvc.perform(withToken(put(likePath(videoId, commentId)))).andExpect(status().isOk());
        flushAndClear();

        mockMvc.perform(withToken(delete(likePath(videoId, commentId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(2))
                .andExpect(jsonPath("$.liked").value(false));
        flushAndClear();

        mockMvc.perform(withToken(get("/api/videos/" + videoId)))
                .andExpect(jsonPath("$.comments[0].likeCount").value(2))
                .andExpect(jsonPath("$.comments[0].likedByMe").value(false));
    }

    @Test
    void unlikingACommentNotLikedChangesNothing() throws Exception {
        mockMvc.perform(withToken(delete(likePath(videoId, commentId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(2))
                .andExpect(jsonPath("$.liked").value(false));
    }

    @Test
    void repliesCanBeLikedToo() throws Exception {
        String body = mockMvc.perform(reply(videoId, commentId, "{\"text\": \"Agree\"}"))
                .andReturn().getResponse().getContentAsString();
        Long replyId = Long.valueOf(body.replaceAll(".*\"id\":(\\d+).*", "$1"));
        flushAndClear();

        mockMvc.perform(withToken(put(likePath(videoId, replyId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(1));
        flushAndClear();

        mockMvc.perform(withToken(get("/api/videos/" + videoId)))
                .andExpect(jsonPath("$.comments[0].likedByMe").value(false))
                .andExpect(jsonPath("$.comments[0].replies[0].likedByMe").value(true));
    }

    @Test
    void likeRequiresALoggedInUser() throws Exception {
        mockMvc.perform(put(likePath(videoId, commentId))).andExpect(status().isUnauthorized());
        mockMvc.perform(delete(likePath(videoId, commentId))).andExpect(status().isUnauthorized());
    }

    @Test
    void likeRejectsATokenOfAUserThatNoLongerExists() throws Exception {
        token = jwtService.generateToken("ghost");

        mockMvc.perform(withToken(put(likePath(videoId, commentId)))).andExpect(status().isUnauthorized());
    }

    @Test
    void likeAnswersNotFoundForAnUnknownVideoOrComment() throws Exception {
        mockMvc.perform(withToken(put(likePath(videoId + 1000, commentId)))).andExpect(status().isNotFound());
        mockMvc.perform(withToken(put(likePath(videoId, commentId + 1000)))).andExpect(status().isNotFound());
        mockMvc.perform(withToken(delete(likePath(otherVideoId, commentId)))).andExpect(status().isNotFound());
    }
}
