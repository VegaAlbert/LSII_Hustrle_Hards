import axios from 'axios';
import { getEnv } from '../utils/Env';
import type { Page, VideoSummary } from '../videos/videosApi';

/**
 * US-12: whether a video is a favourite of the logged-in user.
 */
export type FavouriteState = {
  videoId: number;
  favourite: boolean;
};

// Every call is made as the logged-in user: AuthProvider sends the token in the Authorization header

/**
 * One page of the favourite videos of the logged-in user, last saved first.
 */
export async function fetchFavourites(page: number, size: number): Promise<Page<VideoSummary>> {
  const response = await axios.get<Page<VideoSummary>>(`${getEnv().API_BASE_URL}/favourites`, {
    params: { page, size },
  });
  return response.data;
}

export async function fetchFavouriteState(videoId: number): Promise<FavouriteState> {
  const response = await axios.get<FavouriteState>(`${getEnv().API_BASE_URL}/favourites/${videoId}`);
  return response.data;
}

/**
 * Saves (`favourite` true) or removes a video from the favourites. Both calls are idempotent.
 */
export async function setFavourite(videoId: number, favourite: boolean): Promise<FavouriteState> {
  const url = `${getEnv().API_BASE_URL}/favourites/${videoId}`;
  const response = favourite ? await axios.put<FavouriteState>(url) : await axios.delete<FavouriteState>(url);
  return response.data;
}
