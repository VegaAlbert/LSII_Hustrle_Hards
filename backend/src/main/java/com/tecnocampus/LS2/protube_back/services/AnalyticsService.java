package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.AnalyticsResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.DailyViewsResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoAnalyticsResponse;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.domain.VideoView;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoViewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * US-11: records who watches each video and calculates the analytics of the videos of a user.
 */
@Service
public class AnalyticsService {

    // Length of the "views over time" chart, today included
    static final int DAILY_VIEWS_DAYS = 30;

    private final VideoRepository videoRepository;
    private final VideoViewRepository videoViewRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public AnalyticsService(VideoRepository videoRepository, VideoViewRepository videoViewRepository,
                            UserRepository userRepository, Clock clock) {
        this.videoRepository = videoRepository;
        this.videoViewRepository = videoViewRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    /**
     * Counts one view of a video, dated now. {@code username} is null for anonymous visitors; a token of a user that
     * no longer exists also counts as anonymous, because watching a video does not need an account.
     *
     * @throws VideoNotFoundException if the video does not exist
     */
    @Transactional
    public void recordView(Long videoId, String username) {
        Video video = videoRepository.findById(videoId).orElseThrow(() -> new VideoNotFoundException(videoId));
        User viewer = username == null ? null : userRepository.findByUsername(username).orElse(null);
        videoViewRepository.save(new VideoView(video, viewer, clock.instant()));
    }

    /**
     * Analytics of the videos uploaded by {@code username}. Always filtered by that user, which comes from the token,
     * so nobody can read the analytics of someone else. Imported videos have no uploader and are never included.
     *
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(String username) {
        if (!userRepository.existsByUsername(username)) {
            throw new InvalidCredentialsException();
        }

        List<VideoAnalyticsResponse> videos = videoRepository.findStatisticsByUploader(username).stream()
                .map(VideoAnalyticsResponse::from)
                .toList();
        if (videos.isEmpty()) {
            // Empty state: nothing else to query
            return new AnalyticsResponse(0, 0, 0, 0, 0, 0, List.of(), List.of());
        }

        long totalViews = videos.stream().mapToLong(VideoAnalyticsResponse::views).sum();
        long authenticatedViews = videos.stream().mapToLong(VideoAnalyticsResponse::authenticatedViews).sum();
        long totalComments = videos.stream().mapToLong(VideoAnalyticsResponse::comments).sum();
        long totalCommentLikes = videos.stream().mapToLong(VideoAnalyticsResponse::commentLikes).sum();
        return new AnalyticsResponse(videos.size(), totalViews, authenticatedViews, totalViews - authenticatedViews,
                totalComments, totalCommentLikes, videos, dailyViews(username));
    }

    // Views per UTC day of the last DAILY_VIEWS_DAYS days, oldest first; days without views count 0
    private List<DailyViewsResponse> dailyViews(String username) {
        LocalDate today = LocalDate.now(clock.withZone(ZoneOffset.UTC));
        LocalDate first = today.minusDays(DAILY_VIEWS_DAYS - 1L);

        Map<LocalDate, Long> viewsPerDay = videoViewRepository
                .findViewDatesOfUploaderSince(username, first.atStartOfDay(ZoneOffset.UTC).toInstant()).stream()
                .map(viewedAt -> LocalDate.ofInstant(viewedAt, ZoneOffset.UTC))
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        return first.datesUntil(today.plusDays(1))
                .map(day -> new DailyViewsResponse(day, viewsPerDay.getOrDefault(day, 0L)))
                .toList();
    }
}
