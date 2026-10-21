package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VideoServiceTest {

    @Mock
    VideoRepository videoRepository;

    @InjectMocks
    VideoService videoService;

    @Test
    void getVideosReturnsTheRequestedPageNewestFirst() {
        PageRequest request = PageRequest.of(1, 2, VideoService.NEWEST_FIRST);
        Video video = new Video("3", "Title", "Description", "Author", 90, 1280, 720,
                Instant.ofEpochSecond(1700000000), "3.mp4", "3.webp");
        when(videoRepository.findAll(request)).thenReturn(new PageImpl<>(List.of(video), request, 5));

        PageResponse<VideoSummaryResponse> response = videoService.getVideos(1, 2);

        assertEquals(1, response.page());
        assertEquals(2, response.size());
        assertEquals(5, response.totalElements());
        assertEquals(3, response.totalPages());
        assertEquals(List.of(new VideoSummaryResponse(null, "Title", "Author", 90, "/media/3.webp")),
                response.content());
    }
}
