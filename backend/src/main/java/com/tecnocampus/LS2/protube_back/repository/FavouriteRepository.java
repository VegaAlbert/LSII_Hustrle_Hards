package com.tecnocampus.LS2.protube_back.repository;

import com.tecnocampus.LS2.protube_back.domain.Favourite;
import com.tecnocampus.LS2.protube_back.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FavouriteRepository extends JpaRepository<Favourite, Long> {

    boolean existsByUserIdAndVideoId(Long userId, Long videoId);

    // Returns how many rows were deleted (0 if the video was not a favourite)
    @Modifying
    @Query("DELETE FROM Favourite f WHERE f.user.id = :userId AND f.video.id = :videoId")
    int deleteByUserIdAndVideoId(@Param("userId") Long userId, @Param("videoId") Long videoId);

    /**
     * Favourites of a user with their video already loaded, in the order of {@code pageable}. The count query is
     * separate because a fetch join cannot be counted.
     */
    @Query(value = "SELECT f FROM Favourite f JOIN FETCH f.video WHERE f.user.id = :userId",
            countQuery = "SELECT COUNT(f) FROM Favourite f WHERE f.user.id = :userId")
    Page<Favourite> findByUserId(@Param("userId") Long userId, Pageable pageable);

    // Deleting an account: its favourites and the favourites other users saved of its videos
    @Modifying(flushAutomatically = true)
    @Query("""
            DELETE FROM Favourite f
            WHERE f.user = :user OR f.video IN (SELECT v FROM Video v WHERE v.uploader = :user)
            """)
    int deleteAllOfUser(@Param("user") User user);
}
