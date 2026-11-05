import { checkThumbnailFile, checkVideoFile, MAX_VIDEO_BYTES, titleFromFileName } from '../videoFile';

const fileOf = (type: string, size = 10) => {
  const file = new File(['x'], 'file', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('videoFile', () => {
  it('accepts MP4 and WebM videos up to 100 MB', () => {
    expect(checkVideoFile(fileOf('video/mp4'))).toBeNull();
    expect(checkVideoFile(fileOf('video/webm'))).toBeNull();
    expect(checkVideoFile(fileOf('video/quicktime'))).toBe('Choose an MP4 or WebM video.');
    expect(checkVideoFile(fileOf('video/mp4', MAX_VIDEO_BYTES + 1))).toBe('The video must be at most 100 MB.');
  });

  it('accepts JPG, PNG and WebP thumbnails up to 2 MB', () => {
    expect(checkThumbnailFile(fileOf('image/png'))).toBeNull();
    expect(checkThumbnailFile(fileOf('image/gif'))).toBe('Choose a JPG, PNG or WebP image.');
    expect(checkThumbnailFile(fileOf('image/jpeg', 3 * 1024 * 1024))).toBe('The thumbnail must be at most 2 MB.');
  });

  it('suggests a title from the file name', () => {
    expect(titleFromFileName('my_summer-trip.final.mp4')).toBe('my summer trip.final');
    expect(titleFromFileName(`${'a'.repeat(120)}.mp4`)).toHaveLength(100);
  });
});
