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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

/**
 * "Delete account" of the settings: removes the account of the logged-in user and everything that only makes sense
 * with it, in one transaction:
 * <ul>
 *     <li>the videos it uploaded, with their tags, comments, ratings, favourites and views, and their files in the
 *     store (deleted once the transaction is committed, so a failure never leaves videos without files);</li>
 *     <li>its comments on other videos, with the replies to them, and its comment likes;</li>
 *     <li>its ratings, favourites and subscriptions, and the subscriptions of other users to its channel.</li>
 * </ul>
 * Its views of other videos are kept as anonymous views, so the analytics of their owners do not change.
 */
@Service
public class AccountDeletionService {

    private static final Logger LOG = LoggerFactory.getLogger(AccountDeletionService.class);

    private final UserRepository userRepository;
    private final VideoRepository videoRepository;
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final RatingRepository ratingRepository;
    private final FavouriteRepository favouriteRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final VideoViewRepository videoViewRepository;
    private final PasswordEncoder passwordEncoder;
    private final Path storeDir;

    @SuppressWarnings("java:S107") // One repository per kind of data that belongs to the account
    public AccountDeletionService(UserRepository userRepository, VideoRepository videoRepository,
                                  CommentRepository commentRepository, CommentLikeRepository commentLikeRepository,
                                  RatingRepository ratingRepository, FavouriteRepository favouriteRepository,
                                  SubscriptionRepository subscriptionRepository,
                                  VideoViewRepository videoViewRepository, PasswordEncoder passwordEncoder,
                                  @Value("${pro_tube.store.dir}") String storeDir) {
        this.userRepository = userRepository;
        this.videoRepository = videoRepository;
        this.commentRepository = commentRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.ratingRepository = ratingRepository;
        this.favouriteRepository = favouriteRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.videoViewRepository = videoViewRepository;
        this.passwordEncoder = passwordEncoder;
        this.storeDir = Path.of(storeDir);
    }

    /**
     * @throws InvalidAccountChangeException if the confirmation is missing or wrong (nothing is deleted)
     * @throws InvalidCredentialsException   if the user of the token no longer exists
     */
    @Transactional
    public void deleteAccount(String username, DeleteAccountRequest request) {
        User user = userRepository.findByUsername(username).orElseThrow(InvalidCredentialsException::new);
        checkConfirmation(user, request);

        // Rows pointing to the comments, ratings, favourites, subscriptions and views go before what they point to
        List<Long> commentIds = commentRepository.findIdsToDeleteWith(user);
        commentLikeRepository.deleteByUser(user);
        if (!commentIds.isEmpty()) {
            commentLikeRepository.deleteByCommentIdIn(commentIds);
            commentRepository.deleteRepliesByIdIn(commentIds);
            commentRepository.deleteByIdIn(commentIds);
        }
        ratingRepository.deleteAllOfUser(user);
        favouriteRepository.deleteAllOfUser(user);
        subscriptionRepository.deleteAllOfUser(user);
        videoViewRepository.deleteViewsOfVideosOf(user);
        videoViewRepository.anonymizeViewsOf(user);

        // Removed as entities so their tags go with them; their comments are already deleted
        List<Video> videos = videoRepository.findByUploader(user);
        List<Path> files = videos.stream()
                .flatMap(video -> Stream.of(video.getVideoFile(), video.getThumbnailFile()))
                .map(storeDir::resolve)
                .toList();
        videoRepository.deleteAll(videos);
        userRepository.delete(user);

        afterCommit(() -> deleteQuietly(files));
    }

    private void checkConfirmation(User user, DeleteAccountRequest request) {
        if (user.isPasswordSet()) {
            String password = request.password();
            if (password == null || password.isEmpty()) {
                throw new InvalidAccountChangeException("password", "Password is required");
            }
            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                throw new InvalidAccountChangeException("password", "Password is incorrect");
            }
        } else if (request.confirmation() == null || !request.confirmation().trim().equals(user.getUsername())) {
            // Google accounts without a password confirm by typing their username
            throw new InvalidAccountChangeException("confirmation", "Type your username to confirm");
        }
    }

    // Outside a transaction (unit tests) the action runs at once
    private static void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }

    // A file that cannot be deleted only wastes space: the account is gone anyway
    private static void deleteQuietly(List<Path> files) {
        for (Path file : files) {
            try {
                Files.deleteIfExists(file);
            } catch (IOException e) {
                LOG.warn("Could not delete {} of a deleted account", file, e);
            }
        }
    }
}
