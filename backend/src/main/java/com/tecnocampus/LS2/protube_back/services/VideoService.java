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
}
