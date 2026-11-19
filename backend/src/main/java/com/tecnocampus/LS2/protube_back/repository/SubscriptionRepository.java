package com.tecnocampus.LS2.protube_back.repository;

import com.tecnocampus.LS2.protube_back.domain.Subscription;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    boolean existsBySubscriberIdAndChannel(Long subscriberId, String channel);

    long countByChannel(String channel);

    // The channels a user follows, the most recently followed first
    List<Subscription> findBySubscriberIdOrderBySubscribedAtDesc(Long subscriberId);

    // Returns how many rows were deleted (0 if the user was not subscribed)
    @Modifying
    @Query("DELETE FROM Subscription s WHERE s.subscriber.id = :subscriberId AND s.channel = :channel")
    int deleteBySubscriberIdAndChannel(@Param("subscriberId") Long subscriberId, @Param("channel") String channel);

    /**
     * Videos whose author is one of the channels {@code subscriberId} is subscribed to, in the order of
     * {@code pageable}.
     */
    @Query(value = """
            SELECT v FROM Video v
            WHERE v.author IN (SELECT s.channel FROM Subscription s WHERE s.subscriber.id = :subscriberId)
            """,
            countQuery = """
            SELECT COUNT(v) FROM Video v
            WHERE v.author IN (SELECT s.channel FROM Subscription s WHERE s.subscriber.id = :subscriberId)
            """)
    Page<Video> findVideosOfSubscribedChannels(@Param("subscriberId") Long subscriberId, Pageable pageable);

    // Deleting an account: the channels it follows and the users following its channel, i.e. its username
    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM Subscription s WHERE s.subscriber = :user OR s.channel = :channel")
    int deleteAllOfUser(@Param("user") User user, @Param("channel") String channel);

    // A rename: the subscribers of the channel keep following it under the new username
    @Modifying(flushAutomatically = true)
    @Query("UPDATE Subscription s SET s.channel = :newChannel WHERE s.channel = :oldChannel")
    int renameChannel(@Param("oldChannel") String oldChannel, @Param("newChannel") String newChannel);
}
