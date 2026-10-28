package com.tecnocampus.LS2.protube_back.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocampus.LS2.protube_back.domain.Comment;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VideoStoreImporterTest {

    @TempDir
    Path store;

    @Mock
    VideoRepository videoRepository;

    VideoStoreImporter importer;

    @BeforeEach
    void setUp() {
        importer = new VideoStoreImporter(videoRepository, new ObjectMapper());
    }

    private static String json(String id, String title) {
        return """
                {
                  "id": %s,
                  "width": 1280,
                  "height": 720,
                  "duration": 65.6,
                  "title": "%s",
                  "user": "Some Channel",
                  "timestamp": 1700000000,
                  "meta": {
                    "description": "A long description",
                    "tags": ["a", "b"],
                    "view_count": 10,
                    "comments": [{"text": "Nice", "author": "bob", "timestamp": 1700000001, "like_count": 0}]
                  }
                }
                """.formatted(id, title);
    }

    private void writeVideo(String id, boolean withMp4, boolean withWebp) throws IOException {
        Files.writeString(store.resolve(id + ".json"), json(id, "Video " + id));
        if (withMp4) {
            Files.writeString(store.resolve(id + ".mp4"), "video");
        }
        if (withWebp) {
            Files.writeString(store.resolve(id + ".webp"), "image");
        }
    }

    @Test
    void importsEveryFieldOfAValidVideo() throws IOException {
        writeVideo("0", true, true);

        assertEquals(1, importer.importFrom(store));

        ArgumentCaptor<Video> saved = ArgumentCaptor.forClass(Video.class);
        verify(videoRepository).save(saved.capture());
        Video video = saved.getValue();
        assertEquals("0", video.getStoreId());
        assertEquals("Video 0", video.getTitle());
        assertEquals("A long description", video.getDescription());
        assertEquals("Some Channel", video.getAuthor());
        assertEquals(66, video.getDurationSeconds());
        assertEquals(1280, video.getWidth());
        assertEquals(720, video.getHeight());
        assertEquals(Instant.ofEpochSecond(1700000000), video.getPublishedAt());
        assertEquals("0.mp4", video.getVideoFile());
        assertEquals("0.webp", video.getThumbnailFile());
    }

    @Test
    void importsVideosWithOnlyTheRequiredFields() throws IOException {
        Files.writeString(store.resolve("7.json"), """
                {"id": "7", "title": "Minimal", "timestamp": 1700000000}
                """);
        Files.writeString(store.resolve("7.mp4"), "video");
        Files.writeString(store.resolve("7.webp"), "image");

        assertEquals(1, importer.importFrom(store));

        ArgumentCaptor<Video> saved = ArgumentCaptor.forClass(Video.class);
        verify(videoRepository).save(saved.capture());
        assertEquals(0, saved.getValue().getDurationSeconds());
        assertNull(saved.getValue().getDescription());
    }

    @Test
    void skipsVideosWithoutMp4() throws IOException {
        writeVideo("0", false, true);

        assertEquals(0, importer.importFrom(store));
        verify(videoRepository, never()).save(any());
    }

    @Test
    void skipsVideosWithoutThumbnail() throws IOException {
        writeVideo("0", true, false);

        assertEquals(0, importer.importFrom(store));
        verify(videoRepository, never()).save(any());
    }

    @Test
    void skipsInvalidJsonAndKeepsImportingTheRest() throws IOException {
        Files.writeString(store.resolve("broken.json"), "{not json");
        writeVideo("1", true, true);

        assertEquals(1, importer.importFrom(store));
        verify(videoRepository, times(1)).save(any());
    }

    @Test
    void skipsJsonWithoutRequiredFields() throws IOException {
        Files.writeString(store.resolve("2.json"), """
                {"id": "2", "timestamp": 1700000000}
                """);
        Files.writeString(store.resolve("2.mp4"), "video");
        Files.writeString(store.resolve("2.webp"), "image");

        assertEquals(0, importer.importFrom(store));
        verify(videoRepository, never()).save(any());
    }

    @Test
    void skipsVideosAlreadyImported() throws IOException {
        writeVideo("0", true, true);
        when(videoRepository.existsByStoreId("0")).thenReturn(true);

        assertEquals(0, importer.importFrom(store));
        verify(videoRepository, never()).save(any());
    }

    @Test
    void skipsVideosThatCannotBeSaved() throws IOException {
        writeVideo("0", true, true);
        when(videoRepository.save(any())).thenThrow(new DataIntegrityViolationException("duplicate"));

        assertEquals(0, importer.importFrom(store));
    }

    @Test
    void importsTheCommentsOfTheVideo() throws IOException {
        writeVideo("0", true, true);

        importer.importFrom(store);

        ArgumentCaptor<Video> saved = ArgumentCaptor.forClass(Video.class);
        verify(videoRepository).save(saved.capture());
        Video video = saved.getValue();
        assertEquals(1, video.getComments().size());
        Comment comment = video.getComments().get(0);
        assertEquals("bob", comment.getAuthor());
        assertEquals("Nice", comment.getText());
        assertEquals(0, comment.getLikeCount());
        assertEquals(Instant.ofEpochSecond(1700000001), comment.getPublishedAt());
        assertSame(video, comment.getVideo());
    }

    @Test
    void skipsCommentsWithoutTextOrAuthorAndDefaultsMissingFields() throws IOException {
        Files.writeString(store.resolve("5.json"), """
                {
                  "id": "5", "title": "With comments", "timestamp": 1700000000,
                  "meta": {"comments": [
                    {"text": "", "author": "empty"},
                    {"text": "No author"},
                    {"text": "Kept", "author": "ann"}
                  ]}
                }
                """);
        Files.writeString(store.resolve("5.mp4"), "video");
        Files.writeString(store.resolve("5.webp"), "image");

        importer.importFrom(store);

        ArgumentCaptor<Video> saved = ArgumentCaptor.forClass(Video.class);
        verify(videoRepository).save(saved.capture());
        assertEquals(1, saved.getValue().getComments().size());
        Comment kept = saved.getValue().getComments().get(0);
        assertEquals("Kept", kept.getText());
        assertEquals(0, kept.getLikeCount());
        assertNull(kept.getPublishedAt());
    }

    @Test
    void importsNothingWhenTheStoreDoesNotExist() {
        assertEquals(0, importer.importFrom(store.resolve("missing")));
        verify(videoRepository, never()).save(any());
    }
}
