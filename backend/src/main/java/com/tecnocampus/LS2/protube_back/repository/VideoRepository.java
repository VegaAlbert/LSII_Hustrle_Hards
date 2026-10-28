package com.tecnocampus.LS2.protube_back.repository;

import com.tecnocampus.LS2.protube_back.domain.Video;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VideoRepository extends JpaRepository<Video, Long> {

    boolean existsByStoreId(String storeId);

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
}
