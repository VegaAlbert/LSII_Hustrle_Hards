import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { BACKEND_URL } from '../env';
import { loginAsNewUser, newUser, userMenu } from './support';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

/**
 * Registers a new user (the owner of a channel) and uploads a video as that user through the API, as the subject of
 * these tests is subscribing, not uploading. Returns the username and the id and title of the video.
 */
async function channelWithAVideo(request: APIRequestContext) {
  const owner = newUser('channel');
  const registered = await request.post(`${BACKEND_URL}/api/auth/register`, { data: owner });
  expect(registered.status(), await registered.text()).toBe(201);
  const { token } = await registered.json();
  const title = `E2E channel video ${Date.now()}`;

  const uploaded = await request.post(`${BACKEND_URL}/api/videos`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: {
      metadata: {
        name: 'metadata.json',
        mimeType: 'application/json',
        buffer: Buffer.from(
          JSON.stringify({ title, description: '', tags: [], category: null, ageRestricted: false, durationSeconds: 1 })
        ),
      },
      video: {
        name: 'upload-sample.mp4',
        mimeType: 'video/mp4',
        buffer: fs.readFileSync(path.join(FIXTURES, 'upload-sample.mp4')),
      },
      thumbnail: {
        name: 'thumbnail.webp',
        mimeType: 'image/webp',
        buffer: fs.readFileSync(path.join(FIXTURES, 'store', 'e2e-city-night.webp')),
      },
    },
  });
  expect(uploaded.status(), await uploaded.text()).toBe(201);
  const { id } = await uploaded.json();
  return { channel: owner.username, videoId: id as number, title };
}

test.describe('Subscribe to a channel', () => {
  test('a logged-in user subscribes, sees the videos of the channel and unsubscribes', async ({ page, request }) => {
    const { videoId, title } = await channelWithAVideo(request);
    const user = await loginAsNewUser(page, request);

    await page.goto(`/videos/${videoId}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByText('0 subscribers')).toBeVisible();

    await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Subscribed' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('1 subscriber', { exact: true })).toBeVisible();

    // It was stored by the backend, not only changed on the page
    await page.reload();
    await expect(page.getByRole('button', { name: 'Subscribed' })).toBeVisible();

    // The video of the channel is listed on the subscriptions page
    await userMenu(page, user.username).click();
    await page.getByRole('button', { name: 'Subscriptions' }).click();
    await expect(page).toHaveURL(/\/subscriptions$/);
    await expect(
      page.getByRole('list', { name: 'Videos from your subscriptions' }).getByRole('link', { name: title })
    ).toBeVisible();

    // After unsubscribing the page is empty again
    await page.goto(`/videos/${videoId}`);
    await page.getByRole('button', { name: 'Subscribed' }).click();
    await expect(page.getByRole('button', { name: 'Subscribe', exact: true })).toBeVisible();
    await page.goto('/subscriptions');
    await expect(page.getByText('There are no videos from your subscriptions yet.')).toBeVisible();
  });

  test('an anonymous visitor is asked to log in to subscribe', async ({ page, request }) => {
    const { videoId } = await channelWithAVideo(request);

    await page.goto(`/videos/${videoId}`);
    await page.getByRole('button', { name: 'Subscribe', exact: true }).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});
