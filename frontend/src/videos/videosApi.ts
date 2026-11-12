import axios from 'axios';
import { getEnv } from '../utils/Env';
import type { VideoCategory } from './categories';

export type VideoSummary = {
  id: number;
  title: string;
  author: string | null;
  durationSeconds: number;
  // ISO date
  publishedAt: string;
  // Paths under /media, e.g. /media/0.webp and /media/0.mp4 (the video is played as a preview on hover)
  thumbnailUrl: string;
  videoUrl: string;
  // Shown with an 18+ badge and without hover preview
  ageRestricted: boolean;
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
  // Imported videos have no tags and no category
  tags: string[];
  category: VideoCategory | null;
  ageRestricted: boolean;
  // Username of the user who uploaded it, the only one who can edit it (US-07); null for imported videos
  uploader: string | null;
  comments: VideoComment[];
};

/**
 * Data typed in the upload form (US-06). Duration and size are read from the file by the browser.
 */
export type UploadMetadata = {
  title: string;
  description: string;
  tags: string[];
  category: VideoCategory | null;
  ageRestricted: boolean;
  durationSeconds: number;
  width: number | null;
  height: number | null;
};

/**
 * One page of the video list. With a non-blank `query`, only the matching videos, most relevant first (US-08).
 */
export async function fetchVideos(page: number, size: number, query = ''): Promise<Page<VideoSummary>> {
  const q = query.trim();
  const params = q ? { q, page, size } : { page, size };
  const response = await axios.get<Page<VideoSummary>>(`${getEnv().API_BASE_URL}/videos`, { params });
  return response.data;
}

export async function fetchVideo(id: number): Promise<VideoDetail> {
  const response = await axios.get<VideoDetail>(`${getEnv().API_BASE_URL}/videos/${id}`);
  return response.data;
}

/**
 * US-06: publishes a video as the logged-in user (the token is sent by AuthProvider). `onProgress` receives the
 * uploaded fraction, from 0 to 1.
 */
export async function uploadVideo(
  metadata: UploadMetadata,
  video: File,
  thumbnail: Blob,
  onProgress: (fraction: number) => void = () => {}
): Promise<VideoDetail> {
  const form = new FormData();
  // A JSON part, read by @RequestPart("metadata") in the backend
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('video', video);
  form.append('thumbnail', thumbnail, thumbnail instanceof File ? thumbnail.name : 'thumbnail.jpg');
  const response = await axios.post<VideoDetail>(`${getEnv().API_BASE_URL}/videos`, form, {
    onUploadProgress: (event) => {
      if (event.total) onProgress(event.loaded / event.total);
    },
  });
  return response.data;
}

/**
 * Metadata that the owner of a video can change (US-07). Every field is replaced.
 */
export type VideoChanges = Pick<UploadMetadata, 'title' | 'description' | 'tags' | 'category' | 'ageRestricted'>;

/**
 * US-07: saves the new metadata of a video of the logged-in user. The backend answers 403 for someone else's video.
 */
export async function updateVideo(id: number, changes: VideoChanges): Promise<VideoDetail> {
  const response = await axios.put<VideoDetail>(`${getEnv().API_BASE_URL}/videos/${id}`, changes);
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
