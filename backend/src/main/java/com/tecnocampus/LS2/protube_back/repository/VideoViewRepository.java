package com.tecnocampus.LS2.protube_back.repository;

import com.tecnocampus.LS2.protube_back.domain.VideoView;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
