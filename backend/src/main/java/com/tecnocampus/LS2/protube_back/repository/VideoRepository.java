package com.tecnocampus.LS2.protube_back.repository;

import com.tecnocampus.LS2.protube_back.domain.Video;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VideoRepository extends JpaRepository<Video, Long> {

    boolean existsByStoreId(String storeId);

    // US-13: a channel exists when at least one video has it as author
    boolean existsByAuthor(String author);

    /**
     * US-08: videos whose title, author or description contain the search text, most relevant first: exact title,
     * title starting with the text, title containing it, author containing it and finally only the description.
     * Ties are broken newest first.
     * <p>
     * {@code ilike} is Hibernate's case-insensitive {@code like}; unlike {@code lower()} it also works on the
     * description, which H2 stores as a CLOB. The patterns come with {@code %}, {@code _} and {@code \} escaped
     * (see VideoService), so the text typed by the user is matched literally.
     */
    @Query(value = """
            SELECT v FROM Video v
            WHERE v.title ILIKE :contains ESCAPE '\\'
               OR v.author ILIKE :contains ESCAPE '\\'
               OR v.description ILIKE :contains ESCAPE '\\'
            ORDER BY
                CASE
                    WHEN v.title ILIKE :exact ESCAPE '\\' THEN 0
                    WHEN v.title ILIKE :prefix ESCAPE '\\' THEN 1
                    WHEN v.title ILIKE :contains ESCAPE '\\' THEN 2
                    WHEN v.author ILIKE :contains ESCAPE '\\' THEN 3
                    ELSE 4
                END,
                v.publishedAt DESC,
                v.id DESC
            """,
            countQuery = """
            SELECT count(v) FROM Video v
            WHERE v.title ILIKE :contains ESCAPE '\\'
               OR v.author ILIKE :contains ESCAPE '\\'
               OR v.description ILIKE :contains ESCAPE '\\'
            """)
    Page<Video> search(@Param("exact") String exact, @Param("prefix") String prefix,
                       @Param("contains") String contains, Pageable pageable);

    /**
     * US-11: counters of every video uploaded by {@code username}, newest first, in a single query (the correlated
     * subqueries avoid loading the comments and views of each video one by one).
     */
    @Query("""
            SELECT new com.tecnocampus.LS2.protube_back.repository.VideoStatistics(
                v.id, v.title, v.thumbnailFile, v.publishedAt,
                (SELECT count(vw) FROM VideoView vw WHERE vw.video = v),
                (SELECT count(vw) FROM VideoView vw WHERE vw.video = v AND vw.viewer IS NOT NULL),
                (SELECT count(c) FROM Comment c WHERE c.video = v),
                (SELECT coalesce(sum(c.likeCount), 0L) FROM Comment c WHERE c.video = v))
            FROM Video v
            WHERE v.uploader.username = :username
            ORDER BY v.publishedAt DESC, v.id DESC
            """)
    List<VideoStatistics> findStatisticsByUploader(@Param("username") String username);
}
