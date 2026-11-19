import axios from 'axios';
import {
  fetchSubscribedChannels,
  fetchSubscriberCount,
  fetchSubscription,
  fetchSubscriptionVideos,
  formatSubscribers,
  setSubscription,
} from '../subscriptionsApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('subscriptionsApi', () => {
  beforeEach(() => jest.resetAllMocks());

  it('fetches the subscription state of a channel', async () => {
    const state = { channel: 'bob', subscribed: true, subscribers: 3 };
    mockedAxios.get.mockResolvedValueOnce({ data: state });

    await expect(fetchSubscription('bob')).resolves.toEqual(state);
    expect(mockedAxios.get).toHaveBeenCalledWith('other/subscriptions/channel', { params: { name: 'bob' } });
  });

  it('sends channel names with spaces or slashes as a query parameter', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });

    await fetchSubscription('AC/DC Live');

    expect(mockedAxios.get).toHaveBeenCalledWith('other/subscriptions/channel', { params: { name: 'AC/DC Live' } });
  });

  it('subscribes with a PUT', async () => {
    const state = { channel: 'bob', subscribed: true, subscribers: 1 };
    mockedAxios.put.mockResolvedValueOnce({ data: state });

    await expect(setSubscription('bob', true)).resolves.toEqual(state);
    expect(mockedAxios.put).toHaveBeenCalledWith('other/subscriptions/channel', null, { params: { name: 'bob' } });
  });

  it('unsubscribes with a DELETE', async () => {
    const state = { channel: 'bob', subscribed: false, subscribers: 0 };
    mockedAxios.delete.mockResolvedValueOnce({ data: state });

    await expect(setSubscription('bob', false)).resolves.toEqual(state);
    expect(mockedAxios.delete).toHaveBeenCalledWith('other/subscriptions/channel', { params: { name: 'bob' } });
  });

  it('fetches one page of videos of the subscribed channels', async () => {
    const page = { content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 };
    mockedAxios.get.mockResolvedValueOnce({ data: page });

    await expect(fetchSubscriptionVideos(0, 12)).resolves.toEqual(page);
    expect(mockedAxios.get).toHaveBeenCalledWith('other/subscriptions/videos', { params: { page: 0, size: 12 } });
  });

  it('fetches the channels the logged-in user is subscribed to', async () => {
    const channels = [{ channel: 'bob', subscribed: true, subscribers: 3 }];
    mockedAxios.get.mockResolvedValueOnce({ data: channels });

    await expect(fetchSubscribedChannels()).resolves.toEqual(channels);
    expect(mockedAxios.get).toHaveBeenCalledWith('other/subscriptions/channels');
  });

  it('fetches the number of subscribers of the logged-in user', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { subscribers: 7 } });

    await expect(fetchSubscriberCount()).resolves.toBe(7);
    expect(mockedAxios.get).toHaveBeenCalledWith('other/subscriptions/subscribers');
  });

  it('writes the number of subscribers in singular or plural', () => {
    expect(formatSubscribers(0)).toBe('0 subscribers');
    expect(formatSubscribers(1)).toBe('1 subscriber');
    expect(formatSubscribers(2)).toBe('2 subscribers');
    expect(formatSubscribers(1234)).toBe('1,234 subscribers');
    expect(formatSubscribers(1, 'es')).toBe('1 suscriptor');
    expect(formatSubscribers(1234, 'ca')).toBe('1.234 subscriptors');
  });
});
