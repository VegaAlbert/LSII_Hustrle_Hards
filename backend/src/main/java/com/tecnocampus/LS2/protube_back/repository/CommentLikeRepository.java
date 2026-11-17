package com.tecnocampus.LS2.protube_back.repository;

import com.tecnocampus.LS2.protube_back.domain.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    boolean existsByCommentIdAndUserId(Long commentId, Long userId);

    // Returns how many rows were deleted (0 if the user did not like the comment)
    @Modifying
    @Query("DELETE FROM CommentLike l WHERE l.comment.id = :commentId AND l.user.id = :userId")
    int deleteByCommentIdAndUserId(@Param("commentId") Long commentId, @Param("userId") Long userId);

    /**
     * Ids of the comments of a video liked by a user, to tell the frontend which like buttons are pressed.
     */
    @Query("SELECT l.comment.id FROM CommentLike l WHERE l.comment.video.id = :videoId AND l.user.username = :username")
    Set<Long> findLikedCommentIds(@Param("videoId") Long videoId, @Param("username") String username);
}
