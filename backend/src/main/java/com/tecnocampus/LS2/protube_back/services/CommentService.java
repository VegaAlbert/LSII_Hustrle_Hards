package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.CommentResponse;
import com.tecnocampus.LS2.protube_back.domain.Comment;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.CommentRepository;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class CommentService {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    public CommentService(VideoRepository videoRepository, UserRepository userRepository,
                          CommentRepository commentRepository) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
    }

    /**
     * US-09: publishes a comment of {@code username} on a video, dated now and without likes.
     *
     * @throws VideoNotFoundException      if the video does not exist
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional
    public CommentResponse addComment(Long videoId, String username, String text) {
        Video video = videoRepository.findById(videoId).orElseThrow(() -> new VideoNotFoundException(videoId));
        if (!userRepository.existsByUsername(username)) {
            throw new InvalidCredentialsException();
        }

        Comment comment = new Comment(username, text.trim(), 0, Instant.now());
        // Links both sides of the relation, so the video shows it if it is read again in this transaction
        video.addComment(comment);
        return CommentResponse.from(commentRepository.save(comment));
    }
}
