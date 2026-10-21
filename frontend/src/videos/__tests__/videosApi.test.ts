import axios from 'axios';
import { fetchVideos, toMediaUrl } from '../videosApi';

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

  it('builds media urls on the media server', () => {
    expect(toMediaUrl('/media/0.webp')).toBe('development/0.webp');
  });
});
