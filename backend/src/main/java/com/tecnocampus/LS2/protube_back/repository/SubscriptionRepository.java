package com.tecnocampus.LS2.protube_back.repository;

import com.tecnocampus.LS2.protube_back.domain.Subscription;
import com.tecnocampus.LS2.protube_back.domain.Video;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    boolean existsBySubscriberIdAndChannelId(Long subscriberId, Long channelId);

    long countByChannelId(Long channelId);

    // Returns how many rows were deleted (0 if the user was not subscribed)
    @Modifying
    @Query("DELETE FROM Subscription s WHERE s.subscriber.id = :subscriberId AND s.channel.id = :channelId")
    int deleteBySubscriberIdAndChannelId(@Param("subscriberId") Long subscriberId, @Param("channelId") Long channelId);

    /**
     * Videos uploaded by the channels {@code subscriberId} is subscribed to, in the order of {@code pageable}.
     */
    @Query(value = """
            SELECT v FROM Video v
            WHERE v.uploader IN (SELECT s.channel FROM Subscription s WHERE s.subscriber.id = :subscriberId)
            """,
            countQuery = """
            SELECT COUNT(v) FROM Video v
            WHERE v.uploader IN (SELECT s.channel FROM Subscription s WHERE s.subscriber.id = :subscriberId)
            """)
    Page<Video> findVideosOfSubscribedChannels(@Param("subscriberId") Long subscriberId, Pageable pageable);
}
