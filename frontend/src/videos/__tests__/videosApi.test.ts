import axios from 'axios';
import { fetchVideo, fetchVideos, isNotFound, toMediaUrl } from '../videosApi';

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

  it('builds media urls on the media server', () => {
    expect(toMediaUrl('/media/0.webp')).toBe('development/0.webp');
  });
});
