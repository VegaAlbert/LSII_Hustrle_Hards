import axios from 'axios';
import { getEnv } from '../utils/Env';
import type { Page, VideoSummary } from '../videos/videosApi';

/**
 * US-13: a channel (the author of a video: the username of the user who uploaded it, or the channel an imported video
 * came from), whether the logged-in user is subscribed to it (always false for anonymous visitors) and how many
 * subscribers it has.
 */
export type SubscriptionState = {
  channel: string;
  subscribed: boolean;
  subscribers: number;
};

// Calls are made as the logged-in user when there is one: AuthProvider sends the token in the Authorization header

// The channel goes as a query parameter: author names may hold slashes ("AC/DC") that do not fit in a path
const channelUrl = () => `${getEnv().API_BASE_URL}/subscriptions/channel`;

/**
 * Public: anonymous visitors get the number of subscribers too.
 */
export async function fetchSubscription(channel: string): Promise<SubscriptionState> {
  const response = await axios.get<SubscriptionState>(channelUrl(), { params: { name: channel } });
  return response.data;
}

/**
 * Subscribes to (`subscribed` true) or unsubscribes from a channel. Both calls are idempotent.
 */
export async function setSubscription(channel: string, subscribed: boolean): Promise<SubscriptionState> {
  const config = { params: { name: channel } };
  const response = subscribed
    ? await axios.put<SubscriptionState>(channelUrl(), null, config)
    : await axios.delete<SubscriptionState>(channelUrl(), config);
  return response.data;
}

/**
 * One page of the videos of the channels the logged-in user is subscribed to, newest first.
 */
export async function fetchSubscriptionVideos(page: number, size: number): Promise<Page<VideoSummary>> {
  const response = await axios.get<Page<VideoSummary>>(`${getEnv().API_BASE_URL}/subscriptions/videos`, {
    params: { page, size },
  });
  return response.data;
}

/**
 * Number of users subscribed to the channel of the logged-in user.
 */
export async function fetchSubscriberCount(): Promise<number> {
  const response = await axios.get<{ subscribers: number }>(`${getEnv().API_BASE_URL}/subscriptions/subscribers`);
  return response.data.subscribers;
}

/**
 * "1 subscriber", "3 subscribers".
 */
export function formatSubscribers(count: number): string {
  return `${count} ${count === 1 ? 'subscriber' : 'subscribers'}`;
}
