package com.tecnocampus.LS2.protube_back.repository;

import com.tecnocampus.LS2.protube_back.domain.Rating;
import com.tecnocampus.LS2.protube_back.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    Optional<Rating> findByVideoIdAndUserUsername(Long videoId, String username);

    /**
     * Average and count of the ratings of a video in one query; {@code avg} is null without ratings.
     */
    @Query("""
            SELECT new com.tecnocampus.LS2.protube_back.repository.RatingSummary(avg(r.score), count(r))
            FROM Rating r
            WHERE r.video.id = :videoId
            """)
    RatingSummary summarize(@Param("videoId") Long videoId);

    // Deleting an account: its ratings and the ratings of its videos
    @Modifying(flushAutomatically = true)
    @Query("""
            DELETE FROM Rating r
            WHERE r.user = :user OR r.video IN (SELECT v FROM Video v WHERE v.uploader = :user)
            """)
    int deleteAllOfUser(@Param("user") User user);
}
