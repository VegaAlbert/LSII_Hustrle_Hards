package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.CommentLikeResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.CommentResponse;
import com.tecnocampus.LS2.protube_back.domain.Comment;
import com.tecnocampus.LS2.protube_back.domain.CommentLike;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.CommentLikeRepository;
import com.tecnocampus.LS2.protube_back.repository.CommentRepository;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    VideoRepository videoRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    CommentRepository commentRepository;

    @Mock
    CommentLikeRepository commentLikeRepository;

    @InjectMocks
    CommentService commentService;

    private static Video video() {
        return new Video("abc", "Uptown Funk", null, "Mark Ronson", 79, null, null,
                Instant.parse("2014-11-19T13:20:18Z"), "0.mp4", "0.webp");
    }

    @Test
    void savesTheTrimmedCommentOfTheUserDatedNowWithoutLikes() {
        Video video = video();
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video));
        when(userRepository.existsByUsername("alice")).thenReturn(true);
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        Instant before = Instant.now();

        CommentResponse response = commentService.addComment(5L, "alice", "  Great song!  ");

        ArgumentCaptor<Comment> saved = ArgumentCaptor.forClass(Comment.class);
        verify(commentRepository).save(saved.capture());
        Comment comment = saved.getValue();
        assertEquals("alice", comment.getAuthor());
        assertEquals("Great song!", comment.getText());
        assertEquals(0, comment.getLikeCount());
        assertFalse(comment.getPublishedAt().isBefore(before));
        assertSame(video, comment.getVideo());
        assertTrue(video.getComments().contains(comment));

        assertEquals("alice", response.author());
        assertEquals("Great song!", response.text());
        assertEquals(0, response.likeCount());
        assertEquals(comment.getPublishedAt(), response.publishedAt());
    }

    @Test
    void throwsWhenTheVideoDoesNotExist() {
        when(videoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(VideoNotFoundException.class, () -> commentService.addComment(99L, "alice", "Hi"));
        verify(commentRepository, never()).save(any());
    }

    @Test
    void throwsWhenTheUserOfTheTokenNoLongerExists() {
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video()));
        when(userRepository.existsByUsername("ghost")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> commentService.addComment(5L, "ghost", "Hi"));
        verify(commentRepository, never()).save(any());
    }

    // ===== US-10: replies =====

    @Test
    void savesTheTrimmedReplyNestedUnderTheComment() {
        Video video = video();
        Comment comment = new Comment("bob", "Nice", 0, Instant.parse("2020-01-01T00:00:00Z"));
        video.addComment(comment);
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video));
        when(commentRepository.findByIdAndVideoId(3L, 5L)).thenReturn(Optional.of(comment));
        when(userRepository.existsByUsername("alice")).thenReturn(true);
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CommentResponse response = commentService.addReply(5L, 3L, "alice", "  Agree!  ");

        ArgumentCaptor<Comment> saved = ArgumentCaptor.forClass(Comment.class);
        verify(commentRepository).save(saved.capture());
        Comment reply = saved.getValue();
        assertEquals("alice", reply.getAuthor());
        assertEquals("Agree!", reply.getText());
        assertEquals(0, reply.getLikeCount());
        assertSame(comment, reply.getParent());
        assertSame(video, reply.getVideo());
        assertTrue(comment.getReplies().contains(reply));
        assertEquals("Agree!", response.text());
        assertFalse(response.likedByMe());
    }

    @Test
    void attachesAReplyToAReplyToTheTopLevelComment() {
        Video video = video();
        Comment comment = new Comment("bob", "Nice", 0, Instant.parse("2020-01-01T00:00:00Z"));
        Comment firstReply = new Comment("carol", "Agree", 0, Instant.parse("2020-01-02T00:00:00Z"));
        video.addComment(comment);
        video.addComment(firstReply);
        comment.addReply(firstReply);
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video));
        when(commentRepository.findByIdAndVideoId(4L, 5L)).thenReturn(Optional.of(firstReply));
        when(userRepository.existsByUsername("alice")).thenReturn(true);
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        commentService.addReply(5L, 4L, "alice", "Me too");

        ArgumentCaptor<Comment> saved = ArgumentCaptor.forClass(Comment.class);
        verify(commentRepository).save(saved.capture());
        assertSame(comment, saved.getValue().getParent());
        assertEquals(2, comment.getReplies().size());
        assertTrue(firstReply.getReplies().isEmpty());
    }

    @Test
    void replyThrowsWhenTheVideoDoesNotExist() {
        when(videoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(VideoNotFoundException.class, () -> commentService.addReply(99L, 3L, "alice", "Hi"));
        verify(commentRepository, never()).save(any());
    }

    @Test
    void replyThrowsWhenTheCommentIsNotOfTheVideo() {
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video()));
        when(commentRepository.findByIdAndVideoId(3L, 5L)).thenReturn(Optional.empty());

        CommentNotFoundException e = assertThrows(CommentNotFoundException.class,
                () -> commentService.addReply(5L, 3L, "alice", "Hi"));
        assertEquals("Comment 3 not found", e.getMessage());
        verify(commentRepository, never()).save(any());
    }

    @Test
    void replyThrowsWhenTheUserOfTheTokenNoLongerExists() {
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video()));
        when(commentRepository.findByIdAndVideoId(3L, 5L)).thenReturn(Optional.of(comment()));
        when(userRepository.existsByUsername("ghost")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> commentService.addReply(5L, 3L, "ghost", "Hi"));
        verify(commentRepository, never()).save(any());
    }

    // ===== US-10: likes =====

    private static Comment comment() {
        return new Comment("bob", "Nice", 2, Instant.parse("2020-01-01T00:00:00Z"));
    }

    private User alice;

    private void givenTheCommentAndAlice() {
        alice = new User("alice", "alice@example.com", "hash");
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video()));
        when(commentRepository.findByIdAndVideoId(3L, 5L)).thenReturn(Optional.of(comment()));
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
    }

    @Test
    void likeSavesTheLikeAndIncrementsTheCount() {
        givenTheCommentAndAlice();
        when(commentLikeRepository.existsByCommentIdAndUserId(3L, alice.getId())).thenReturn(false);
        when(commentRepository.findLikeCount(3L)).thenReturn(3);

        CommentLikeResponse response = commentService.likeComment(5L, 3L, "alice");

        ArgumentCaptor<CommentLike> saved = ArgumentCaptor.forClass(CommentLike.class);
        verify(commentLikeRepository).save(saved.capture());
        assertSame(alice, saved.getValue().getUser());
        verify(commentRepository).incrementLikeCount(3L);
        assertEquals(new CommentLikeResponse(3, true), response);
    }

    @Test
    void likingTwiceDoesNotCountTwice() {
        givenTheCommentAndAlice();
        when(commentLikeRepository.existsByCommentIdAndUserId(3L, alice.getId())).thenReturn(true);
        when(commentRepository.findLikeCount(3L)).thenReturn(3);

        CommentLikeResponse response = commentService.likeComment(5L, 3L, "alice");

        verify(commentLikeRepository, never()).save(any());
        verify(commentRepository, never()).incrementLikeCount(any());
        assertEquals(new CommentLikeResponse(3, true), response);
    }

    @Test
    void unlikeRemovesTheLikeAndDecrementsTheCount() {
        givenTheCommentAndAlice();
        when(commentLikeRepository.deleteByCommentIdAndUserId(3L, alice.getId())).thenReturn(1);
        when(commentRepository.findLikeCount(3L)).thenReturn(2);

        CommentLikeResponse response = commentService.unlikeComment(5L, 3L, "alice");

        verify(commentRepository).decrementLikeCount(3L);
        assertEquals(new CommentLikeResponse(2, false), response);
    }

    @Test
    void unlikingACommentNotLikedDoesNotChangeTheCount() {
        givenTheCommentAndAlice();
        when(commentLikeRepository.deleteByCommentIdAndUserId(3L, alice.getId())).thenReturn(0);
        when(commentRepository.findLikeCount(3L)).thenReturn(2);

        CommentLikeResponse response = commentService.unlikeComment(5L, 3L, "alice");

        verify(commentRepository, never()).decrementLikeCount(any());
        assertEquals(new CommentLikeResponse(2, false), response);
    }

    @Test
    void likeThrowsWhenTheVideoDoesNotExist() {
        when(videoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(VideoNotFoundException.class, () -> commentService.likeComment(99L, 3L, "alice"));
        verify(commentLikeRepository, never()).save(any());
    }

    @Test
    void likeThrowsWhenTheCommentIsNotOfTheVideo() {
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video()));
        when(commentRepository.findByIdAndVideoId(3L, 5L)).thenReturn(Optional.empty());

        assertThrows(CommentNotFoundException.class, () -> commentService.likeComment(5L, 3L, "alice"));
        assertThrows(CommentNotFoundException.class, () -> commentService.unlikeComment(5L, 3L, "alice"));
        verify(commentLikeRepository, never()).save(any());
    }

    @Test
    void likeThrowsWhenTheUserOfTheTokenNoLongerExists() {
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video()));
        when(commentRepository.findByIdAndVideoId(3L, 5L)).thenReturn(Optional.of(comment()));
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> commentService.likeComment(5L, 3L, "ghost"));
        assertThrows(InvalidCredentialsException.class, () -> commentService.unlikeComment(5L, 3L, "ghost"));
        verify(commentLikeRepository, never()).save(any());
    }
}
