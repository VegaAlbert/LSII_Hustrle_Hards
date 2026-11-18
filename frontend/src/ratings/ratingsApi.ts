import axios from 'axios';
import { getEnv } from '../utils/Env';

// Same range as RateVideoRequest in the backend
export const MIN_SCORE = 1;
export const MAX_SCORE = 5;

/**
 * Ratings of a video. `average` is rounded to one decimal and is null while nobody has rated the video; `myScore` is
 * the score of the logged-in user, null for anonymous visitors or if they have not rated it.
 */
export type VideoRating = {
  average: number | null;
  count: number;
  myScore: number | null;
};

const ratingUrl = (videoId: number) => `${getEnv().API_BASE_URL}/videos/${videoId}/rating`;

export async function fetchRating(videoId: number): Promise<VideoRating> {
  const response = await axios.get<VideoRating>(ratingUrl(videoId));
  return response.data;
}

/**
 * Rates a video as the logged-in user (the token is sent by AuthProvider), or changes their previous rating. Returns
 * the new average.
 */
export async function rateVideo(videoId: number, score: number): Promise<VideoRating> {
  const response = await axios.put<VideoRating>(ratingUrl(videoId), { score });
  return response.data;
}
