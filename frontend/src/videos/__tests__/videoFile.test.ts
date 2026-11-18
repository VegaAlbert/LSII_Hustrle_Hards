import { checkThumbnailFile, checkVideoFile, MAX_VIDEO_BYTES, readVideoFile, titleFromFileName } from '../videoFile';

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

describe('readVideoFile', () => {
  // jsdom does not decode media nor draw on canvas: the <video> fires its events by hand and the canvas is mocked
  type FakeVideo = { duration: number; videoWidth: number; videoHeight: number; failOnLoad?: boolean };
  let seekedAt: number[];

  const mockVideo = ({ failOnLoad = false, ...metadata }: FakeVideo) => {
    const createElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = createElement(tagName);
      if (tagName !== 'video') return element;
      Object.defineProperties(element, {
        duration: { get: () => metadata.duration },
        videoWidth: { get: () => metadata.videoWidth },
        videoHeight: { get: () => metadata.videoHeight },
        currentTime: {
          set: (time: number) => {
            seekedAt.push(time);
            setTimeout(() => element.dispatchEvent(new Event('seeked')));
          },
        },
      });
      setTimeout(() => element.dispatchEvent(new Event(failOnLoad ? 'error' : 'loadeddata')));
      return element;
    });
  };

  const mockCanvas = (hasContext: boolean) => {
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() =>
        hasContext ? ({ drawImage: jest.fn() } as unknown as CanvasRenderingContext2D) : null
      );
    jest
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback: BlobCallback) => callback(new Blob(['frame'], { type: 'image/jpeg' })));
  };

  const video = new File(['x'], 'clip.mp4', { type: 'video/mp4' });

  beforeEach(() => {
    seekedAt = [];
    URL.createObjectURL = jest.fn(() => 'blob:clip');
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => jest.restoreAllMocks());

  it('reads the duration and size and takes three frames at 25%, 50% and 75%', async () => {
    mockVideo({ duration: 39.6, videoWidth: 1280, videoHeight: 720 });
    mockCanvas(true);

    const info = await readVideoFile(video);

    expect(info).toEqual({ durationSeconds: 40, width: 1280, height: 720, frames: expect.any(Array) });
    expect(info.frames).toHaveLength(3);
    expect(seekedAt).toEqual([39.6 * 0.25, 39.6 * 0.5, 39.6 * 0.75]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:clip');
  });

  it('returns no frames and no size when the browser cannot draw them', async () => {
    mockVideo({ duration: Infinity, videoWidth: 0, videoHeight: 0 });
    mockCanvas(false);

    await expect(readVideoFile(video)).resolves.toEqual({ durationSeconds: 0, width: null, height: null, frames: [] });
  });

  it('rejects when the browser cannot play the file and still frees its URL', async () => {
    mockVideo({ duration: 0, videoWidth: 0, videoHeight: 0, failOnLoad: true });

    await expect(readVideoFile(video)).rejects.toThrow('The video cannot be read');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:clip');
  });
});
