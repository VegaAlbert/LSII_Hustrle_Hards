package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.DeleteAccountRequest;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.CommentLikeRepository;
import com.tecnocampus.LS2.protube_back.repository.CommentRepository;
import com.tecnocampus.LS2.protube_back.repository.FavouriteRepository;
import com.tecnocampus.LS2.protube_back.repository.RatingRepository;
import com.tecnocampus.LS2.protube_back.repository.SubscriptionRepository;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoViewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountDeletionServiceTest {

    @Mock
    UserRepository userRepository;
    @Mock
    VideoRepository videoRepository;
    @Mock
    CommentRepository commentRepository;
    @Mock
    CommentLikeRepository commentLikeRepository;
    @Mock
    RatingRepository ratingRepository;
    @Mock
    FavouriteRepository favouriteRepository;
    @Mock
    SubscriptionRepository subscriptionRepository;
    @Mock
    VideoViewRepository videoViewRepository;
    @Mock
    PasswordEncoder passwordEncoder;

    @TempDir
    Path store;

    AccountDeletionService service;
    User alice;

    @BeforeEach
    void setUp() {
        service = new AccountDeletionService(userRepository, videoRepository, commentRepository,
                commentLikeRepository, ratingRepository, favouriteRepository, subscriptionRepository,
                videoViewRepository, passwordEncoder, store.toString());
        alice = new User("alice", "alice@mail.com", "hash");
        lenient().when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
    }

    private Video uploadedVideo() throws IOException {
        Files.writeString(store.resolve("upload-1.mp4"), "video");
        Files.writeString(store.resolve("upload-1-thumbnail.webp"), "thumbnail");
        Video video = new Video("upload-1", "Mine", null, "alice", 10, null, null, Instant.now(),
                "upload-1.mp4", "upload-1-thumbnail.webp");
        video.setUploader(alice);
        return video;
    }

    @Test
    void deletesEverythingOfTheAccountAndTheFilesOfItsVideos() throws IOException {
        Video video = uploadedVideo();
        when(passwordEncoder.matches("password123", "hash")).thenReturn(true);
        when(commentRepository.findIdsToDeleteWith(alice)).thenReturn(List.of(7L, 8L));
        when(videoRepository.findByUploader(alice)).thenReturn(List.of(video));

        service.deleteAccount("alice", new DeleteAccountRequest("password123", null));

        // What points to a row is deleted before the row
        InOrder order = inOrder(commentLikeRepository, commentRepository, videoViewRepository, videoRepository,
                userRepository);
        order.verify(commentLikeRepository).deleteByCommentIdIn(List.of(7L, 8L));
        order.verify(commentRepository).deleteRepliesByIdIn(List.of(7L, 8L));
        order.verify(commentRepository).deleteByIdIn(List.of(7L, 8L));
        order.verify(videoViewRepository).deleteViewsOfVideosOf(alice);
        order.verify(videoRepository).deleteAll(List.of(video));
        order.verify(userRepository).delete(alice);
        verify(commentLikeRepository).deleteByUser(alice);
        verify(ratingRepository).deleteAllOfUser(alice);
        verify(favouriteRepository).deleteAllOfUser(alice);
        verify(subscriptionRepository).deleteAllOfUser(alice, "alice");
        verify(videoViewRepository).anonymizeViewsOf(alice);
        assertFalse(Files.exists(store.resolve("upload-1.mp4")));
        assertFalse(Files.exists(store.resolve("upload-1-thumbnail.webp")));
    }

    @Test
    void insideATransactionTheFilesAreDeletedOnlyAfterTheCommit() throws IOException {
        Video video = uploadedVideo();
        when(passwordEncoder.matches("password123", "hash")).thenReturn(true);
        when(videoRepository.findByUploader(alice)).thenReturn(List.of(video));
        TransactionSynchronizationManager.initSynchronization();
        try {
            service.deleteAccount("alice", new DeleteAccountRequest("password123", null));

            // A rollback must still find the files of the videos it brings back
            assertTrue(Files.exists(store.resolve("upload-1.mp4")));

            TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
            assertFalse(Files.exists(store.resolve("upload-1.mp4")));
            assertFalse(Files.exists(store.resolve("upload-1-thumbnail.webp")));
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void skipsTheCommentDeletesWhenThereAreNoComments() {
        when(passwordEncoder.matches("password123", "hash")).thenReturn(true);
        when(commentRepository.findIdsToDeleteWith(alice)).thenReturn(List.of());

        service.deleteAccount("alice", new DeleteAccountRequest("password123", null));

        verify(commentRepository, never()).deleteByIdIn(any());
        verify(commentLikeRepository, never()).deleteByCommentIdIn(any());
        verify(userRepository).delete(alice);
    }

    @Test
    void wrongPasswordDeletesNothing() throws IOException {
        uploadedVideo();
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        InvalidAccountChangeException e = assertThrows(InvalidAccountChangeException.class,
                () -> service.deleteAccount("alice", new DeleteAccountRequest("wrong", null)));

        assertEquals("password", e.getField());
        assertEquals("Password is incorrect", e.getMessage());
        verifyNoInteractions(commentRepository, videoRepository, ratingRepository);
        verify(userRepository, never()).delete(any());
        assertTrue(Files.exists(store.resolve("upload-1.mp4")));
    }

    @Test
    void missingPasswordDeletesNothing() {
        InvalidAccountChangeException e = assertThrows(InvalidAccountChangeException.class,
                () -> service.deleteAccount("alice", new DeleteAccountRequest(null, "alice")));

        assertEquals("Password is required", e.getMessage());
        verify(userRepository, never()).delete(any());
    }

    @Test
    void googleAccountWithoutPasswordConfirmsWithItsUsername() {
        User carol = User.fromGoogle("carol", "carol@gmail.com", "random", "g-carol");
        when(userRepository.findByUsername("carol")).thenReturn(Optional.of(carol));

        service.deleteAccount("carol", new DeleteAccountRequest(null, " carol "));

        verify(userRepository).delete(carol);
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void googleAccountWithAWrongConfirmationDeletesNothing() {
        User carol = User.fromGoogle("carol", "carol@gmail.com", "random", "g-carol");
        when(userRepository.findByUsername("carol")).thenReturn(Optional.of(carol));

        InvalidAccountChangeException e = assertThrows(InvalidAccountChangeException.class,
                () -> service.deleteAccount("carol", new DeleteAccountRequest(null, "alice")));

        assertEquals("confirmation", e.getField());
        verify(userRepository, never()).delete(any());
    }

    @Test
    void unknownUserIsRejected() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class,
                () -> service.deleteAccount("ghost", new DeleteAccountRequest("x", null)));
    }
}
