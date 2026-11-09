package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.UploadVideoRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoDetailResponse;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.domain.VideoCategory;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VideoUploadServiceTest {

    private static final byte[] VIDEO_BYTES = {1, 2, 3, 4};
    private static final byte[] IMAGE_BYTES = {9, 8, 7};

    @Mock
    VideoRepository videoRepository;

    @Mock
    UserRepository userRepository;

    @TempDir
    Path storeDir;

    VideoUploadService service;

    @BeforeEach
    void setUp() {
        service = new VideoUploadService(videoRepository, userRepository, storeDir.toString());
    }

    private static UploadVideoRequest request(List<String> tags) {
        return new UploadVideoRequest("  My trip  ", "Day one\n#travel", tags, VideoCategory.TRAVEL_AND_EVENTS, true,
                95, 1920, 1080);
    }

    private static MockMultipartFile video() {
        return new MockMultipartFile("video", "trip.mp4", "video/mp4", VIDEO_BYTES);
    }

    private static MockMultipartFile thumbnail() {
        return new MockMultipartFile("thumbnail", "frame.jpg", "image/jpeg", IMAGE_BYTES);
    }

    private void givenUser() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(new User("alice", "a@a.com", "hash")));
    }

    private List<Path> storedFiles() throws IOException {
        try (Stream<Path> files = Files.list(storeDir)) {
            return files.toList();
        }
    }

    @Test
    void storesTheFilesAndSavesTheVideoOwnedByTheUser() throws IOException {
        givenUser();
        when(videoRepository.saveAndFlush(any(Video.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VideoDetailResponse response = service.upload("alice", request(List.of("Beach")), video(), thumbnail());

        ArgumentCaptor<Video> saved = ArgumentCaptor.forClass(Video.class);
        verify(videoRepository).saveAndFlush(saved.capture());
        Video video = saved.getValue();
        assertEquals("My trip", video.getTitle());
        assertEquals("Day one\n#travel", video.getDescription());
        assertEquals("alice", video.getAuthor());
        assertEquals("alice", video.getUploader().getUsername());
        assertEquals(95, video.getDurationSeconds());
        assertEquals(1920, video.getWidth());
        assertEquals(1080, video.getHeight());
        assertEquals(List.of("Beach"), video.getTags());
        assertEquals(VideoCategory.TRAVEL_AND_EVENTS, video.getCategory());
        assertTrue(video.isAgeRestricted());
        assertTrue(Duration.between(video.getPublishedAt(), Instant.now()).abs().getSeconds() < 5);
        assertTrue(video.getStoreId().startsWith("upload-"));

        assertEquals(video.getStoreId() + ".mp4", video.getVideoFile());
        assertEquals(video.getStoreId() + "-thumbnail.jpg", video.getThumbnailFile());
        assertArrayEquals(VIDEO_BYTES, Files.readAllBytes(storeDir.resolve(video.getVideoFile())));
        assertArrayEquals(IMAGE_BYTES, Files.readAllBytes(storeDir.resolve(video.getThumbnailFile())));

        assertEquals("/media/" + video.getVideoFile(), response.videoUrl());
        assertEquals(List.of("Beach"), response.tags());
        assertTrue(response.ageRestricted());
    }

    @Test
    void keepsWebmVideosAndPngThumbnailsWithTheirExtension() {
        givenUser();
        when(videoRepository.saveAndFlush(any(Video.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VideoDetailResponse response = service.upload("alice", request(null),
                new MockMultipartFile("video", "clip.webm", "video/webm", VIDEO_BYTES),
                new MockMultipartFile("thumbnail", "frame.png", "image/png", IMAGE_BYTES));

        assertTrue(response.videoUrl().endsWith(".webm"));
        assertTrue(response.thumbnailUrl().endsWith("-thumbnail.png"));
        assertEquals(List.of(), response.tags());
    }

    @Test
    void savesABlankDescriptionAsNull() {
        givenUser();
        when(videoRepository.saveAndFlush(any(Video.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UploadVideoRequest request = new UploadVideoRequest("Title", "   ", List.of(), null, false, 0, null, null);

        VideoDetailResponse response = service.upload("alice", request, video(), thumbnail());

        assertEquals(null, response.description());
    }

    @Test
    void rejectsAMissingVideo() throws IOException {
        InvalidUploadException e = assertThrows(InvalidUploadException.class, () -> service.upload("alice",
                request(List.of()), new MockMultipartFile("video", new byte[0]), thumbnail()));

        assertEquals("video", e.getField());
        assertEquals("The video file is required", e.getMessage());
        verify(videoRepository, never()).saveAndFlush(any());
        assertTrue(storedFiles().isEmpty());
    }

    @Test
    void rejectsAnUnsupportedVideoFormat() {
        MockMultipartFile avi = new MockMultipartFile("video", "clip.avi", "video/x-msvideo", VIDEO_BYTES);

        InvalidUploadException e = assertThrows(InvalidUploadException.class,
                () -> service.upload("alice", request(List.of()), avi, thumbnail()));

        assertEquals("video", e.getField());
        assertEquals("The video must be an MP4 or WebM file", e.getMessage());
    }

    @Test
    void rejectsAThumbnailThatIsNotAnImage() {
        MockMultipartFile pdf = new MockMultipartFile("thumbnail", "a.pdf", "application/pdf", IMAGE_BYTES);

        InvalidUploadException e = assertThrows(InvalidUploadException.class,
                () -> service.upload("alice", request(List.of()), video(), pdf));

        assertEquals("thumbnail", e.getField());
    }

    @Test
    void rejectsAThumbnailWithoutContentType() {
        MockMultipartFile unknown = new MockMultipartFile("thumbnail", "a", null, IMAGE_BYTES);

        assertThrows(InvalidUploadException.class, () -> service.upload("alice", request(List.of()), video(), unknown));
    }

    @Test
    void rejectsAThumbnailBiggerThanTwoMegabytes() {
        byte[] big = new byte[(int) VideoUploadService.MAX_THUMBNAIL_BYTES + 1];
        MockMultipartFile thumbnail = new MockMultipartFile("thumbnail", "big.jpg", "image/jpeg", big);

        InvalidUploadException e = assertThrows(InvalidUploadException.class,
                () -> service.upload("alice", request(List.of()), video(), thumbnail));

        assertEquals("The thumbnail must be at most 2 MB", e.getMessage());
    }

    @Test
    void rejectsAUserThatNoLongerExists() throws IOException {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class,
                () -> service.upload("ghost", request(List.of()), video(), thumbnail()));
        assertTrue(storedFiles().isEmpty());
    }

    @Test
    void deletesTheFilesWhenTheVideoCannotBeSaved() throws IOException {
        givenUser();
        DataIntegrityViolationException failure = new DataIntegrityViolationException("boom");
        when(videoRepository.saveAndFlush(any(Video.class))).thenThrow(failure);

        DataIntegrityViolationException thrown = assertThrows(DataIntegrityViolationException.class,
                () -> service.upload("alice", request(List.of()), video(), thumbnail()));

        assertSame(failure, thrown);
        assertTrue(storedFiles().isEmpty());
    }

    @Test
    void deletesTheVideoWhenTheThumbnailCannotBeWritten() throws IOException {
        givenUser();
        MultipartFile thumbnail = mock(MultipartFile.class);
        when(thumbnail.isEmpty()).thenReturn(false);
        when(thumbnail.getContentType()).thenReturn("image/jpeg");
        when(thumbnail.getSize()).thenReturn(10L);
        doThrow(new IOException("disk full")).when(thumbnail).transferTo(any(Path.class));

        assertThrows(VideoStorageException.class,
                () -> service.upload("alice", request(List.of()), video(), thumbnail));

        assertTrue(storedFiles().isEmpty());
        verify(videoRepository, never()).saveAndFlush(any());
    }

    @Test
    void normalizesTags() {
        List<String> tags = Arrays.asList("  #Travel ", "travel", "", null, "##road   trip", "Beach");

        assertEquals(List.of("Travel", "road trip", "Beach"), VideoUploadService.normalizeTags(tags));
        assertEquals(List.of(), VideoUploadService.normalizeTags(null));
    }
}
