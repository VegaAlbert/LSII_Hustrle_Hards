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
  // US-10: whether the logged-in user likes it (always false for anonymous visitors)
  likedByMe: boolean;
  // US-10: replies, oldest first. Always empty for a reply: there is only one level
  replies: VideoComment[];
};

/**
 * US-10: answer of liking or unliking a comment.
 */
export type CommentLike = {
  likeCount: number;
  liked: boolean;
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

// Same limit as CreateCommentRequest in the backend
export const MAX_COMMENT_LENGTH = 1000;

/**
 * US-09: publishes a comment on a video as the logged-in user (the token is sent by AuthProvider).
 */
export async function postComment(videoId: number, text: string): Promise<VideoComment> {
  const response = await axios.post<VideoComment>(`${getEnv().API_BASE_URL}/videos/${videoId}/comments`, { text });
  return response.data;
}

/**
 * US-10: replies to a comment of a video as the logged-in user. A reply to a reply is attached by the backend to the
 * top-level comment.
 */
export async function postReply(videoId: number, commentId: number, text: string): Promise<VideoComment> {
  const response = await axios.post<VideoComment>(
    `${getEnv().API_BASE_URL}/videos/${videoId}/comments/${commentId}/replies`,
    { text }
  );
  return response.data;
}

/**
 * US-10: likes (`liked` true) or unlikes a comment as the logged-in user. Both calls are idempotent.
 */
export async function setCommentLike(videoId: number, commentId: number, liked: boolean): Promise<CommentLike> {
  const url = `${getEnv().API_BASE_URL}/videos/${videoId}/comments/${commentId}/like`;
  const response = liked ? await axios.put<CommentLike>(url) : await axios.delete<CommentLike>(url);
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
