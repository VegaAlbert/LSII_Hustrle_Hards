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

export async function fetchVideos(page: number, size: number): Promise<Page<VideoSummary>> {
  const response = await axios.get<Page<VideoSummary>>(`${getEnv().API_BASE_URL}/videos`, { params: { page, size } });
  return response.data;
}

/**
 * Turns a media path sent by the backend (/media/0.webp) into a URL on the media server.
 */
export function toMediaUrl(mediaPath: string): string {
  return `${getEnv().MEDIA_BASE_URL}${mediaPath.replace(/^\/media/, '')}`;
}
