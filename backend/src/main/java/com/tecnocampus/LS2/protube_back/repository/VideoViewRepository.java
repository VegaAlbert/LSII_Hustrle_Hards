package com.tecnocampus.LS2.protube_back.repository;

import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.VideoView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface VideoViewRepository extends JpaRepository<VideoView, Long> {

    /**
     * US-11: dates of the views since {@code since} of the videos uploaded by {@code username}. They are grouped by
     * day in the service, so the query does not depend on the date functions of each database (H2, PostgreSQL).
     */
    @Query("""
            SELECT vw.viewedAt FROM VideoView vw
            WHERE vw.video.uploader.username = :username AND vw.viewedAt >= :since
            """)
    List<Instant> findViewDatesOfUploaderSince(@Param("username") String username, @Param("since") Instant since);

    // Deleting an account: the views of its videos go with them
    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM VideoView vw WHERE vw.video IN (SELECT v FROM Video v WHERE v.uploader = :user)")
    int deleteViewsOfVideosOf(@Param("user") User user);

    // ...while its views of other videos stay as anonymous ones, so the analytics of their owners do not change
    @Modifying(flushAutomatically = true)
    @Query("UPDATE VideoView vw SET vw.viewer = null WHERE vw.viewer = :user")
    int anonymizeViewsOf(@Param("user") User user);
}
