package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoDetailResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VideoService {

    // Newest first; the id breaks ties so pages never repeat or skip videos with the same date
    static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("publishedAt"), Sort.Order.desc("id"));

    private final VideoRepository videoRepository;

    public VideoService(VideoRepository videoRepository) {
        this.videoRepository = videoRepository;
    }

    /**
     * US-04: one page of the video list, newest first.
     */
    @Transactional(readOnly = true)
    public PageResponse<VideoSummaryResponse> getVideos(int page, int size) {
        return PageResponse.from(videoRepository.findAll(PageRequest.of(page, size, NEWEST_FIRST))
                .map(VideoSummaryResponse::from));
    }

    /**
     * US-05: one video with its comments. Read in a transaction so the lazy comments can be loaded.
     */
    @Transactional(readOnly = true)
    public VideoDetailResponse getVideo(Long id) {
        return videoRepository.findById(id)
                .map(VideoDetailResponse::from)
                .orElseThrow(() -> new VideoNotFoundException(id));
    }

    /**
     * US-08: one page of the videos matching {@code query}, most relevant first. A blank query is not an error: it
     * returns the whole list, as {@link #getVideos(int, int)} (team decision for the empty search).
     */
    @Transactional(readOnly = true)
    public PageResponse<VideoSummaryResponse> searchVideos(String query, int page, int size) {
        if (query == null || query.isBlank()) {
            return getVideos(page, size);
        }

        // The ORDER BY of the query already ranks the results, so the page request is unsorted
        String text = escapeLike(query.trim());
        return PageResponse.from(videoRepository.search(text, text + "%", "%" + text + "%", PageRequest.of(page, size))
                .map(VideoSummaryResponse::from));
    }

    // Makes %, _ and \ typed by the user match literally instead of acting as LIKE wildcards
    static String escapeLike(String text) {
        return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
