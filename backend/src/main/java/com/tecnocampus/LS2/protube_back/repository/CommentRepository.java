package com.tecnocampus.LS2.protube_back.repository;

import com.tecnocampus.LS2.protube_back.domain.Comment;
import com.tecnocampus.LS2.protube_back.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // US-10: a comment only if it belongs to that video, so /videos/1/comments/{id of video 2} answers 404
    Optional<Comment> findByIdAndVideoId(Long id, Long videoId);

    /*
     * US-10: the count is changed in the database with one UPDATE instead of reading, adding and saving it, so two
     * users liking at the same time never lose a like. clearAutomatically makes the next read see the new value.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Comment c SET c.likeCount = c.likeCount + 1 WHERE c.id = :id")
    void incrementLikeCount(@Param("id") Long id);

    // Never below 0, as imported comments may have been liked here without the like being counted in the store
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Comment c SET c.likeCount = c.likeCount - 1 WHERE c.id = :id AND c.likeCount > 0")
    void decrementLikeCount(@Param("id") Long id);

    @Query("SELECT c.likeCount FROM Comment c WHERE c.id = :id")
    int findLikeCount(@Param("id") Long id);

    // Comments written in ProTube show the username: renamed with the account
    @Modifying
    @Query("UPDATE Comment c SET c.author = :author WHERE c.user = :user")
    int renameAuthor(@Param("user") User user, @Param("author") String author);

    /**
     * Deleting an account: ids of its comments, of every comment of its videos and of the replies to its comments.
     */
    @Query("""
            SELECT c.id FROM Comment c LEFT JOIN c.parent p
            WHERE c.user = :user OR c.video.uploader = :user OR p.user = :user
            """)
    List<Long> findIdsToDeleteWith(@Param("user") User user);

    // Replies first, as they point to their top-level comment
    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM Comment c WHERE c.id IN :ids AND c.parent IS NOT NULL")
    int deleteRepliesByIdIn(@Param("ids") Collection<Long> ids);

    @Modifying
    @Query("DELETE FROM Comment c WHERE c.id IN :ids")
    int deleteByIdIn(@Param("ids") Collection<Long> ids);
}
