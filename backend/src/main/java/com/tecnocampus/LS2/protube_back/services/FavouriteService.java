package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.FavouriteResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.domain.Favourite;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.FavouriteRepository;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * US-12: the favourite videos of each user.
 */
@Service
public class FavouriteService {

    // Last saved first; the id breaks ties so pages never repeat or skip favourites saved at the same instant
    static final Sort LAST_SAVED_FIRST = Sort.by(Sort.Order.desc("savedAt"), Sort.Order.desc("id"));

    private final FavouriteRepository favouriteRepository;
    private final UserRepository userRepository;
    private final VideoRepository videoRepository;

    public FavouriteService(FavouriteRepository favouriteRepository, UserRepository userRepository,
                            VideoRepository videoRepository) {
        this.favouriteRepository = favouriteRepository;
        this.userRepository = userRepository;
        this.videoRepository = videoRepository;
    }

    /**
     * One page of the favourite videos of {@code username}, last saved first.
     *
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional(readOnly = true)
    public PageResponse<VideoSummaryResponse> getFavourites(String username, int page, int size) {
        User user = findUser(username);
        return PageResponse.from(favouriteRepository.findByUserId(user.getId(),
                        PageRequest.of(page, size, LAST_SAVED_FIRST))
                .map(favourite -> VideoSummaryResponse.from(favourite.getVideo())));
    }

    /**
     * Whether a video is a favourite of {@code username}.
     *
     * @throws VideoNotFoundException      if the video does not exist
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional(readOnly = true)
    public FavouriteResponse isFavourite(String username, Long videoId) {
        findVideo(videoId);
        User user = findUser(username);
        return new FavouriteResponse(videoId, favouriteRepository.existsByUserIdAndVideoId(user.getId(), videoId));
    }

    /**
     * Saves a video as favourite of {@code username}. Saving it again changes nothing.
     *
     * @throws VideoNotFoundException      if the video does not exist
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional
    public FavouriteResponse addFavourite(String username, Long videoId) {
        Video video = findVideo(videoId);
        User user = findUser(username);
        if (!favouriteRepository.existsByUserIdAndVideoId(user.getId(), videoId)) {
            favouriteRepository.save(new Favourite(user, video, Instant.now()));
        }
        return new FavouriteResponse(videoId, true);
    }

    /**
     * Removes a video from the favourites of {@code username}. Removing one that is not saved changes nothing.
     *
     * @throws VideoNotFoundException      if the video does not exist
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional
    public FavouriteResponse removeFavourite(String username, Long videoId) {
        findVideo(videoId);
        User user = findUser(username);
        favouriteRepository.deleteByUserIdAndVideoId(user.getId(), videoId);
        return new FavouriteResponse(videoId, false);
    }

    private Video findVideo(Long videoId) {
        return videoRepository.findById(videoId).orElseThrow(() -> new VideoNotFoundException(videoId));
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username).orElseThrow(InvalidCredentialsException::new);
    }
}
