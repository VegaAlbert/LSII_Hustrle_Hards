package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.UploadVideoRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoDetailResponse;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * US-06: stores an uploaded video and its thumbnail in the video store and adds the video to the catalog.
 * Either everything is saved or nothing is: if any step fails, the files already written are deleted.
 */
@Service
public class VideoUploadService {

    private static final Logger LOG = LoggerFactory.getLogger(VideoUploadService.class);

    // Formats every browser can play with the <video> tag, by content type -> file extension
    static final Map<String, String> VIDEO_TYPES = Map.of("video/mp4", "mp4", "video/webm", "webm");
    static final Map<String, String> IMAGE_TYPES = Map.of("image/jpeg", "jpg", "image/png", "png", "image/webp", "webp");
    // Same limit as YouTube's custom thumbnails
    static final long MAX_THUMBNAIL_BYTES = 2L * 1024 * 1024;

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final Path storeDir;

    public VideoUploadService(VideoRepository videoRepository, UserRepository userRepository,
                              @Value("${pro_tube.store.dir}") String storeDir) {
        this.videoRepository = videoRepository;
        this.userRepository = userRepository;
        this.storeDir = Path.of(storeDir);
    }

    /**
     * Publishes the video as {@code username}, dated now.
     *
     * @throws InvalidUploadException     if a file is missing, empty, too big or of an unsupported format
     * @throws InvalidCredentialsException if the user of the token no longer exists
     * @throws VideoStorageException      if the files cannot be written to the store
     */
    @Transactional
    public VideoDetailResponse upload(String username, UploadVideoRequest request, MultipartFile videoFile,
                                      MultipartFile thumbnailFile) {
        String videoExtension = extensionOf(videoFile, VIDEO_TYPES, "video",
                "The video must be an MP4 or WebM file");
        String thumbnailExtension = extensionOf(thumbnailFile, IMAGE_TYPES, "thumbnail",
                "The thumbnail must be a JPG, PNG or WebP image");
        if (thumbnailFile.getSize() > MAX_THUMBNAIL_BYTES) {
            throw new InvalidUploadException("thumbnail", "The thumbnail must be at most 2 MB");
        }
        User uploader = userRepository.findByUsername(username).orElseThrow(InvalidCredentialsException::new);

        String storeId = "upload-" + UUID.randomUUID();
        Path videoPath = storeDir.resolve(storeId + "." + videoExtension);
        Path thumbnailPath = storeDir.resolve(storeId + "-thumbnail." + thumbnailExtension);
        try {
            Files.createDirectories(storeDir);
            videoFile.transferTo(videoPath);
            thumbnailFile.transferTo(thumbnailPath);

            Video video = new Video(storeId, request.title().trim(), blankToNull(request.description()),
                    uploader.getUsername(), request.durationSeconds(), request.width(), request.height(),
                    Instant.now(), videoPath.getFileName().toString(), thumbnailPath.getFileName().toString());
            video.setTags(normalizeTags(request.tags()));
            video.setCategory(request.category());
            video.setAgeRestricted(request.ageRestricted());
            video.setUploader(uploader);
            // saveAndFlush so a database error happens here, while the files can still be deleted
            return VideoDetailResponse.from(videoRepository.saveAndFlush(video));
        } catch (IOException e) {
            deleteQuietly(videoPath, thumbnailPath);
            throw new VideoStorageException(e);
        } catch (RuntimeException e) {
            deleteQuietly(videoPath, thumbnailPath);
            throw e;
        }
    }

    /**
     * Trims the tags, drops a leading {@code #}, blank tags and repeated ones (ignoring case), keeping their order.
     */
    static List<String> normalizeTags(List<String> tags) {
        if (tags == null) {
            return List.of();
        }
        Set<String> seen = new LinkedHashSet<>();
        List<String> result = new ArrayList<>();
        for (String tag : tags) {
            if (tag == null) {
                continue;
            }
            String clean = tag.trim().replaceFirst("^#+", "").replaceAll("\\s+", " ").trim();
            if (!clean.isEmpty() && seen.add(clean.toLowerCase(Locale.ROOT))) {
                result.add(clean);
            }
        }
        return result;
    }

    private static String extensionOf(MultipartFile file, Map<String, String> allowedTypes, String field,
                                      String message) {
        if (file == null || file.isEmpty()) {
            throw new InvalidUploadException(field, "The " + field + " file is required");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String extension = allowedTypes.get(contentType);
        if (extension == null) {
            throw new InvalidUploadException(field, message);
        }
        return extension;
    }

    private static String blankToNull(String text) {
        return text == null || text.isBlank() ? null : text.strip();
    }

    private static void deleteQuietly(Path... paths) {
        for (Path path : paths) {
            try {
                Files.deleteIfExists(path);
            } catch (IOException e) {
                LOG.warn("Could not delete {} after a failed upload", path, e);
            }
        }
    }
}
