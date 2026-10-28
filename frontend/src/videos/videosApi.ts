import axios from 'axios';
import { getEnv } from '../utils/Env';

export type VideoSummary = {
  id: number;
  title: string;
  author: string | null;
  durationSeconds: number;
  // Path under /media, e.g. /media/0.webp
  thumbnailUrl: string;
};

export type Page<T> = {
  content: T[];
  // Zero-based
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type VideoComment = {
  id: number;
  author: string;
  text: string;
  likeCount: number;
  // ISO date; null for imported comments without a date
  publishedAt: string | null;
};

export type VideoDetail = {
  id: number;
  title: string;
  description: string | null;
  author: string | null;
  durationSeconds: number;
  width: number | null;
  height: number | null;
  // ISO date
  publishedAt: string;
  // Paths under /media, e.g. /media/0.mp4
  videoUrl: string;
  thumbnailUrl: string;
  comments: VideoComment[];
};

export async function fetchVideos(page: number, size: number): Promise<Page<VideoSummary>> {
  const response = await axios.get<Page<VideoSummary>>(`${getEnv().API_BASE_URL}/videos`, { params: { page, size } });
  return response.data;
}

export async function fetchVideo(id: number): Promise<VideoDetail> {
  const response = await axios.get<VideoDetail>(`${getEnv().API_BASE_URL}/videos/${id}`);
  return response.data;
}

/**
 * True when a request failed because the resource does not exist (HTTP 404).
 */
export function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

/**
 * Turns a media path sent by the backend (/media/0.webp) into a URL on the media server.
 */
export function toMediaUrl(mediaPath: string): string {
  return `${getEnv().MEDIA_BASE_URL}${mediaPath.replace(/^\/media/, '')}`;
}
