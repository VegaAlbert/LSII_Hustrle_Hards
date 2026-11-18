package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.VideoRatingResponse;
import com.tecnocampus.LS2.protube_back.domain.Rating;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.RatingRepository;
import com.tecnocampus.LS2.protube_back.repository.RatingSummary;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;

/**
 * Video ratings: users rate videos from 1 to 5 stars and everybody sees the average.
 */
@Service
public class RatingService {

    private final RatingRepository ratingRepository;
    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public RatingService(RatingRepository ratingRepository, VideoRepository videoRepository,
                         UserRepository userRepository, Clock clock) {
        this.ratingRepository = ratingRepository;
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    /**
     * Average, number of ratings and, if {@code username} is not null, the score that user gave.
     *
     * @throws VideoNotFoundException if the video does not exist
     */
    @Transactional(readOnly = true)
    public VideoRatingResponse getRating(Long videoId, String username) {
        if (!videoRepository.existsById(videoId)) {
            throw new VideoNotFoundException(videoId);
        }
        return summary(videoId, username);
    }

    /**
     * Saves the rating of {@code username} (taken from the token) for a video. The first time it creates the rating;
     * afterwards it changes the existing one, so a user never has two ratings of the same video.
     *
     * @throws VideoNotFoundException      if the video does not exist
     * @throws InvalidCredentialsException if the user of the token no longer exists
     * @throws RatingConflictException     if another rating of the same user and video was saved at the same time
     */
    @Transactional
    public VideoRatingResponse rate(Long videoId, String username, int score) {
        Video video = videoRepository.findById(videoId).orElseThrow(() -> new VideoNotFoundException(videoId));
        User user = userRepository.findByUsername(username).orElseThrow(InvalidCredentialsException::new);
        Instant now = clock.instant();

        ratingRepository.findByVideoIdAndUserUsername(videoId, username).ifPresentOrElse(
                rating -> rating.changeScore(score, now),
                () -> {
                    try {
                        // Flushed now so the unique constraint is checked here and not at the end of the transaction
                        ratingRepository.saveAndFlush(new Rating(user, video, score, now));
                    } catch (DataIntegrityViolationException e) {
                        throw new RatingConflictException(videoId);
                    }
                });
        return summary(videoId, username);
    }

    private VideoRatingResponse summary(Long videoId, String username) {
        RatingSummary summary = ratingRepository.summarize(videoId);
        Integer myScore = username == null ? null : ratingRepository.findByVideoIdAndUserUsername(videoId, username)
                .map(Rating::getScore)
                .orElse(null);
        return new VideoRatingResponse(roundToOneDecimal(summary.average()), summary.count(), myScore);
    }

    // 4.4666 -> 4.5; null (no ratings) stays null
    static Double roundToOneDecimal(Double average) {
        return average == null ? null : BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
