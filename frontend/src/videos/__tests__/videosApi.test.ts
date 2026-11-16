import axios from 'axios';
import {
  fetchVideo,
  fetchVideos,
  isNotFound,
  postComment,
  toMediaUrl,
  uploadVideo,
  type UploadMetadata,
} from '../videosApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('videosApi', () => {
  beforeEach(() => jest.resetAllMocks());

  it('fetches one page of videos', async () => {
    const page = { content: [], page: 1, size: 12, totalElements: 12, totalPages: 1 };
    mockedAxios.get.mockResolvedValueOnce({ data: page });

    await expect(fetchVideos(1, 12)).resolves.toEqual(page);
    expect(mockedAxios.get).toHaveBeenCalledWith('other/videos', { params: { page: 1, size: 12 } });
  });

  it('fetches the detail of one video', async () => {
    const video = { id: 5, title: 'Video 5' };
    mockedAxios.get.mockResolvedValueOnce({ data: video });

    await expect(fetchVideo(5)).resolves.toEqual(video);
    expect(mockedAxios.get).toHaveBeenCalledWith('other/videos/5');
  });

  it('uploads a video as a multipart form and reports the progress', async () => {
    const created = { id: 9, title: 'Trip' };
    mockedAxios.post.mockResolvedValueOnce({ data: created });
    const metadata: UploadMetadata = {
      title: 'Trip',
      description: '',
      tags: ['beach'],
      category: null,
      ageRestricted: false,
      durationSeconds: 10,
      width: null,
      height: null,
    };
    const video = new File(['v'], 'trip.mp4', { type: 'video/mp4' });
    const onProgress = jest.fn();

    await expect(uploadVideo(metadata, video, new Blob(['t'], { type: 'image/jpeg' }), onProgress)).resolves.toEqual(
      created
    );

    const [url, form, config] = mockedAxios.post.mock.calls[0] as [
      string,
      FormData,
      { onUploadProgress: (e: object) => void },
    ];
    expect(url).toBe('other/videos');
    expect(form.get('video')).toBe(video);
    expect((form.get('thumbnail') as File).name).toBe('thumbnail.jpg');
    const metadataPart = form.get('metadata') as Blob;
    expect(metadataPart.type).toBe('application/json');
    // jsdom's Blob has no text(), so it is read with a FileReader
    const json = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(metadataPart);
    });
    expect(JSON.parse(json)).toEqual(metadata);
    config.onUploadProgress({ loaded: 25, total: 100 });
    config.onUploadProgress({ loaded: 25 });
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(0.25);
  });

  it('detects not found errors', () => {
    mockedAxios.isAxiosError.mockReturnValue(true);

    expect(isNotFound({ response: { status: 404 } })).toBe(true);
    expect(isNotFound({ response: { status: 500 } })).toBe(false);
    expect(isNotFound({})).toBe(false);
  });

  it('does not treat other errors as not found', () => {
    mockedAxios.isAxiosError.mockReturnValue(false);

    expect(isNotFound(new Error('Network Error'))).toBe(false);
  });

  it('sends the trimmed search text as q', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 },
    });

    await fetchVideos(0, 12, '  cats ');

    expect(mockedAxios.get).toHaveBeenCalledWith('other/videos', { params: { q: 'cats', page: 0, size: 12 } });
  });

  it('does not send q for a blank search', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 },
    });

    await fetchVideos(0, 12, '   ');

    expect(mockedAxios.get).toHaveBeenCalledWith('other/videos', { params: { page: 0, size: 12 } });
  });

  it('posts a comment on a video', async () => {
    const comment = { id: 7, author: 'alice', text: 'Hi', likeCount: 0, publishedAt: '2026-11-12T10:00:00Z' };
    mockedAxios.post.mockResolvedValueOnce({ data: comment });

    await expect(postComment(5, 'Hi')).resolves.toEqual(comment);
    expect(mockedAxios.post).toHaveBeenCalledWith('other/videos/5/comments', { text: 'Hi' });
  });

  it('builds media urls on the media server', () => {
    expect(toMediaUrl('/media/0.webp')).toBe('development/0.webp');
  });
});
