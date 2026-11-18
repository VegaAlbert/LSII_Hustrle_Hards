import axios from 'axios';
import { translate } from '../i18n/translate';
import type { Language } from '../settings/settings';
import { getEnv } from '../utils/Env';
import type { Page, VideoSummary } from '../videos/videosApi';

/**
 * US-13: a channel (the username of the user who uploads its videos), whether the logged-in user is subscribed to it
 * (always false for anonymous visitors) and how many subscribers it has.
 */
export type SubscriptionState = {
  channel: string;
  subscribed: boolean;
  subscribers: number;
};

// Calls are made as the logged-in user when there is one: AuthProvider sends the token in the Authorization header

const channelUrl = (channel: string) => `${getEnv().API_BASE_URL}/channels/${encodeURIComponent(channel)}/subscription`;

/**
 * Public: anonymous visitors get the number of subscribers too.
 */
export async function fetchSubscription(channel: string): Promise<SubscriptionState> {
  const response = await axios.get<SubscriptionState>(channelUrl(channel));
  return response.data;
}

/**
 * Subscribes to (`subscribed` true) or unsubscribes from a channel. Both calls are idempotent.
 */
export async function setSubscription(channel: string, subscribed: boolean): Promise<SubscriptionState> {
  const url = channelUrl(channel);
  const response = subscribed ? await axios.put<SubscriptionState>(url) : await axios.delete<SubscriptionState>(url);
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
 * "1 subscriber", "3 subscribers" in a language, e.g. "3 suscriptores" / "3 subscriptors".
 */
export function formatSubscribers(count: number, language: Language = 'en'): string {
  return translate(language, 'video.subscribers', { count });
}
