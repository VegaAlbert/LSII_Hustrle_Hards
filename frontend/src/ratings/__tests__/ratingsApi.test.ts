import axios from 'axios';
import { fetchRating, rateVideo } from '../ratingsApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ratingsApi', () => {
  beforeEach(() => jest.resetAllMocks());

  it('fetches the rating of a video', async () => {
    const rating = { average: 4.5, count: 2, myScore: null };
    mockedAxios.get.mockResolvedValueOnce({ data: rating });

    await expect(fetchRating(5)).resolves.toEqual(rating);
    expect(mockedAxios.get).toHaveBeenCalledWith('other/videos/5/rating');
  });

  it('rates a video with only the score: the user comes from the token', async () => {
    const rating = { average: 4, count: 1, myScore: 4 };
    mockedAxios.put.mockResolvedValueOnce({ data: rating });

    await expect(rateVideo(5, 4)).resolves.toEqual(rating);
    expect(mockedAxios.put).toHaveBeenCalledWith('other/videos/5/rating', { score: 4 });
  });
});
