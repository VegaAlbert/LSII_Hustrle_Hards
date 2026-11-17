import axios from 'axios';
import { getEnv } from '../utils/Env';

/**
 * Analytics of one of my videos (US-11). `commentLikes` is the sum of the likes of its comments.
 */
export type VideoAnalytics = {
  id: number;
  title: string;
  // Path under /media, e.g. /media/upload-1-thumbnail.jpg
  thumbnailUrl: string;
  // ISO date
  publishedAt: string;
  views: number;
  authenticatedViews: number;
  anonymousViews: number;
  comments: number;
  commentLikes: number;
};

export type DailyViews = {
  // ISO day (UTC), e.g. 2026-11-17
  date: string;
  views: number;
};

/**
 * Analytics of the videos of the logged-in user. Without videos every total is 0 and both lists are empty.
 */
export type Analytics = {
  totalVideos: number;
  totalViews: number;
  authenticatedViews: number;
  anonymousViews: number;
  totalComments: number;
  totalCommentLikes: number;
  // Newest first
  videos: VideoAnalytics[];
  // Last 30 days, oldest first
  dailyViews: DailyViews[];
};

/**
 * US-11: analytics of my videos. The user comes from the token sent by AuthProvider, never from a parameter.
 */
export async function fetchMyAnalytics(): Promise<Analytics> {
  const response = await axios.get<Analytics>(`${getEnv().API_BASE_URL}/analytics`);
  return response.data;
}
