import axios from 'axios';
import { fetchFavourites, fetchFavouriteState, setFavourite } from '../favouritesApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('favouritesApi', () => {
  beforeEach(() => jest.resetAllMocks());

  it('fetches one page of favourite videos', async () => {
    const page = { content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 };
    mockedAxios.get.mockResolvedValueOnce({ data: page });

    await expect(fetchFavourites(0, 12)).resolves.toEqual(page);
    expect(mockedAxios.get).toHaveBeenCalledWith('other/favourites', { params: { page: 0, size: 12 } });
  });

  it('fetches whether a video is a favourite', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { videoId: 5, favourite: true } });

    await expect(fetchFavouriteState(5)).resolves.toEqual({ videoId: 5, favourite: true });
    expect(mockedAxios.get).toHaveBeenCalledWith('other/favourites/5');
  });

  it('saves a favourite with a PUT', async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: { videoId: 5, favourite: true } });

    await expect(setFavourite(5, true)).resolves.toEqual({ videoId: 5, favourite: true });
    expect(mockedAxios.put).toHaveBeenCalledWith('other/favourites/5');
  });

  it('removes a favourite with a DELETE', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: { videoId: 5, favourite: false } });

    await expect(setFavourite(5, false)).resolves.toEqual({ videoId: 5, favourite: false });
    expect(mockedAxios.delete).toHaveBeenCalledWith('other/favourites/5');
  });
});
