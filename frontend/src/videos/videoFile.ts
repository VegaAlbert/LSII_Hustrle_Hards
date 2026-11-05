// Formats every browser can play, same list as VideoUploadService in the backend
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;

export type VideoFileInfo = {
  durationSeconds: number;
  width: number | null;
  height: number | null;
  // Frames taken at 25%, 50% and 75% of the video, offered as thumbnails; empty if the browser cannot draw them
  frames: Blob[];
};

/**
 * Error message for a video the backend would reject, or null if it can be uploaded.
 */
export function checkVideoFile(file: File): string | null {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) return 'Choose an MP4 or WebM video.';
  if (file.size > MAX_VIDEO_BYTES) return 'The video must be at most 100 MB.';
  return null;
}

export function checkThumbnailFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Choose a JPG, PNG or WebP image.';
  if (file.size > MAX_THUMBNAIL_BYTES) return 'The thumbnail must be at most 2 MB.';
  return null;
}

/**
 * Title suggested from the file name, as YouTube does: "my_trip-2024.mp4" -> "my trip 2024".
 */
export function titleFromFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .slice(0, 100);
}

function waitFor(video: HTMLVideoElement, event: 'loadeddata' | 'seeked'): Promise<void> {
  return new Promise((resolve, reject) => {
    video.addEventListener(event, () => resolve(), { once: true });
    video.addEventListener('error', () => reject(new Error('The video cannot be read')), { once: true });
  });
}

function drawFrame(video: HTMLVideoElement): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  if (!context) return Promise.resolve(null);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
}

/**
 * Reads the duration and size of a local video and takes three frames for the thumbnail, without uploading anything.
 * Rejects if the browser cannot play the file.
 */
export async function readVideoFile(file: File): Promise<VideoFileInfo> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.preload = 'auto';
  video.src = url;
  try {
    await waitFor(video, 'loadeddata');
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const frames: Blob[] = [];
    for (const position of [0.25, 0.5, 0.75]) {
      video.currentTime = duration * position;
      await waitFor(video, 'seeked');
      const frame = await drawFrame(video);
      if (frame) frames.push(frame);
    }
    return {
      durationSeconds: Math.round(duration),
      width: video.videoWidth || null,
      height: video.videoHeight || null,
      frames,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
