import axios from 'axios';
import { fetchMyAnalytics } from '../analyticsApi';
import { recordView } from '../../videos/videosApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('analyticsApi', () => {
  beforeEach(() => jest.resetAllMocks());

  it('requests the analytics of the logged-in user without sending any user id', async () => {
    const analytics = { totalVideos: 0, videos: [], dailyViews: [] };
    mockedAxios.get.mockResolvedValueOnce({ data: analytics });

    await expect(fetchMyAnalytics()).resolves.toBe(analytics);

    expect(mockedAxios.get).toHaveBeenCalledWith('other/analytics');
  });

  it('counts a view of a video', async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 204 });

    await recordView(5);

    expect(mockedAxios.post).toHaveBeenCalledWith('other/videos/5/views');
  });
});
