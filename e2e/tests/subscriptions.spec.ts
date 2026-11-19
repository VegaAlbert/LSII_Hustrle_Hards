import { expect, test, type APIRequestContext } from '@playwright/test';
import { loginAsNewUser, openVideoFromSearch, registerNewUser, SEED_VIDEOS, uploadVideoAs, userMenu } from './support';

/**
 * Registers a new user (the owner of a channel) and uploads a video as that user through the API, as the subject of
 * these tests is subscribing, not uploading. Returns the username and the id and title of the video.
 */
async function channelWithAVideo(request: APIRequestContext) {
  const owner = await registerNewUser(request, 'channel');
  const title = `E2E channel video ${Date.now()}`;
  const videoId = await uploadVideoAs(request, owner, title);
  return { channel: owner.username, videoId, title };
}

test.describe('Subscribe to a channel', () => {
  test('a logged-in user subscribes, sees the videos of the channel and unsubscribes', async ({ page, request }) => {
    const { channel, videoId, title } = await channelWithAVideo(request);
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

    // The subscriptions page lists the channel (not the video) and, below, the latest videos of the channel
    await userMenu(page, user.username).click();
    await page.getByRole('button', { name: 'Subscriptions' }).click();
    await expect(page).toHaveURL(/\/subscriptions$/);
    const channels = page.getByRole('list', {
      name: 'Channels you are subscribed to',
    });
    await expect(channels.getByRole('listitem')).toHaveCount(1);
    await expect(channels.getByText(channel, { exact: true })).toBeVisible();
    await expect(channels.getByText(title)).toHaveCount(0);
    await expect(
      page.getByRole('list', { name: 'Videos from your subscriptions' }).getByRole('link', { name: title })
    ).toBeVisible();

    // Unsubscribing from the list empties the page
    await channels.getByRole('button', { name: 'Subscribed' }).click();
    await expect(channels.getByRole('button', { name: 'Subscribe', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('You are not subscribed to any channel yet.')).toBeVisible();
    await expect(page.getByText('There are no videos from your subscriptions yet.')).toBeVisible();
  });

  test('a logged-in user subscribes to the channel of an imported video', async ({ page, request }) => {
    const user = await loginAsNewUser(page, request);

    // Imported videos have no uploader, but their author is a channel too. Other tests may follow the same seed
    // channel at the same time, so the number of subscribers is not checked here
    await openVideoFromSearch(page, SEED_VIDEOS.city);
    await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Subscribed' })).toHaveAttribute('aria-pressed', 'true');

    // Both seed videos come from the same channel, so both are listed
    await userMenu(page, user.username).click();
    await page.getByRole('button', { name: 'Subscriptions' }).click();
    const list = page.getByRole('list', {
      name: 'Videos from your subscriptions',
    });
    await expect(list.getByRole('link', { name: SEED_VIDEOS.city })).toBeVisible();
    await expect(list.getByRole('link', { name: SEED_VIDEOS.mountain })).toBeVisible();
  });

  test('an anonymous visitor is asked to log in to subscribe', async ({ page }) => {
    await openVideoFromSearch(page, SEED_VIDEOS.mountain);
    await page.getByRole('button', { name: 'Subscribe', exact: true }).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});
