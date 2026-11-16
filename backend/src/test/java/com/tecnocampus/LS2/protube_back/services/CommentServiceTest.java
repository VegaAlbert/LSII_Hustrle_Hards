package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.CommentResponse;
import com.tecnocampus.LS2.protube_back.domain.Comment;
import com.tecnocampus.LS2.protube_back.domain.Video;
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
}
