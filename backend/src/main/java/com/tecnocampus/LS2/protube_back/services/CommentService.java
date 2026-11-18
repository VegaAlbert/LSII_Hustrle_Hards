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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class CommentService {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;

    public CommentService(VideoRepository videoRepository, UserRepository userRepository,
                          CommentRepository commentRepository, CommentLikeRepository commentLikeRepository) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.commentLikeRepository = commentLikeRepository;
    }

    /**
     * US-09: publishes a comment of {@code username} on a video, dated now and without likes.
     *
     * @throws VideoNotFoundException      if the video does not exist
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional
    public CommentResponse addComment(Long videoId, String username, String text) {
        Video video = findVideo(videoId);
        User author = findUser(username);

        Comment comment = new Comment(author, text.trim(), Instant.now());
        // Links both sides of the relation, so the video shows it if it is read again in this transaction
        video.addComment(comment);
        return CommentResponse.from(commentRepository.save(comment));
    }

    /**
     * US-10: publishes a reply of {@code username} to a comment of a video. There is only one level of replies, so
     * a reply to a reply is attached to the top-level comment of the conversation.
     *
     * @throws VideoNotFoundException      if the video does not exist
     * @throws CommentNotFoundException    if the comment does not exist or belongs to another video
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional
    public CommentResponse addReply(Long videoId, Long commentId, String username, String text) {
        Video video = findVideo(videoId);
        Comment comment = findComment(videoId, commentId);
        User author = findUser(username);

        Comment parent = comment.getParent() != null ? comment.getParent() : comment;
        Comment reply = new Comment(author, text.trim(), Instant.now());
        // A reply also belongs to the video, so it is saved and deleted with it like any other comment
        video.addComment(reply);
        parent.addReply(reply);
        return CommentResponse.from(commentRepository.save(reply));
    }

    /**
     * US-10: {@code username} likes a comment. Liking it again changes nothing.
     *
     * @throws VideoNotFoundException      if the video does not exist
     * @throws CommentNotFoundException    if the comment does not exist or belongs to another video
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional
    public CommentLikeResponse likeComment(Long videoId, Long commentId, String username) {
        findVideo(videoId);
        Comment comment = findComment(videoId, commentId);
        User user = findUser(username);

        if (!commentLikeRepository.existsByCommentIdAndUserId(commentId, user.getId())) {
            commentLikeRepository.save(new CommentLike(comment, user));
            commentRepository.incrementLikeCount(commentId);
        }
        return new CommentLikeResponse(commentRepository.findLikeCount(commentId), true);
    }

    /**
     * US-10: {@code username} stops liking a comment. Unliking a comment that was not liked changes nothing.
     *
     * @throws VideoNotFoundException      if the video does not exist
     * @throws CommentNotFoundException    if the comment does not exist or belongs to another video
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional
    public CommentLikeResponse unlikeComment(Long videoId, Long commentId, String username) {
        findVideo(videoId);
        findComment(videoId, commentId);
        User user = findUser(username);

        // Only a like that really existed lowers the count
        if (commentLikeRepository.deleteByCommentIdAndUserId(commentId, user.getId()) > 0) {
            commentRepository.decrementLikeCount(commentId);
        }
        return new CommentLikeResponse(commentRepository.findLikeCount(commentId), false);
    }

    private Video findVideo(Long videoId) {
        return videoRepository.findById(videoId).orElseThrow(() -> new VideoNotFoundException(videoId));
    }

    private Comment findComment(Long videoId, Long commentId) {
        return commentRepository.findByIdAndVideoId(commentId, videoId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username).orElseThrow(InvalidCredentialsException::new);
    }
}
