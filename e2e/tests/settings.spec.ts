import { expect, test } from '@playwright/test';
import { BACKEND_URL } from '../env';
import { loginAsNewUser, newUser, openVideoFromSearch, SEED_VIDEOS, userMenu } from './support';

test.describe('Settings', () => {
  test('the text size is applied to the whole app and kept after a reload', async ({ page }) => {
    await page.goto('/settings');
    const rootFontSize = () => page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    await expect.poll(rootFontSize).toBe('16px');

    // The radio itself is hidden behind its label, as in a segmented control
    await page.getByRole('radiogroup', { name: 'Text size' }).getByText('Large').click();
    await expect.poll(rootFontSize).toBe('18px');

    await page.reload();
    await expect(page.getByRole('radio', { name: 'Large' })).toBeChecked();
    await expect.poll(rootFontSize).toBe('18px');
  });

  test('the player follows the autoplay and playback speed settings', async ({ page }) => {
    await page.goto('/settings');
    await page.getByLabel('Autoplay').uncheck();
    await page.getByLabel('Playback speed').selectOption('1.5');

    await openVideoFromSearch(page, SEED_VIDEOS.mountain);
    const player = page.getByLabel(`Video player: ${SEED_VIDEOS.mountain}`);
    await expect
      .poll(() => player.evaluate((video: HTMLVideoElement) => video.readyState), {
        message: 'the video metadata should load',
      })
      .toBeGreaterThan(0);

    expect(await player.evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
    expect(await player.evaluate((video: HTMLVideoElement) => video.playbackRate)).toBe(1.5);
  });

  test('a user changes the username, email and password of the account', async ({ page, request }) => {
    const user = await loginAsNewUser(page, request);
    const renamed = `${user.username}_new`;
    const newEmail = `new-${user.email}`;
    const newPassword = 'e2e-new-password-456';

    await page.goto('/settings');
    const account = page.getByRole('region', { name: 'Account' });

    await account.getByRole('button', { name: 'Change username' }).click();
    await account.getByLabel('New username').fill(renamed);
    await account.getByRole('button', { name: 'Save' }).click();
    await expect(account.getByRole('status')).toHaveText('Username updated.');
    await expect(userMenu(page, renamed)).toBeVisible();

    await account.getByRole('button', { name: 'Change email' }).click();
    await account.getByLabel('New email').fill(newEmail);
    await account.getByRole('button', { name: 'Save' }).click();
    await expect(account.getByText(newEmail)).toBeVisible();

    await account.getByRole('button', { name: 'Change password' }).click();
    await account.getByLabel('Current password').fill(user.password);
    await account.getByLabel('New password').fill(newPassword);
    await account.getByRole('button', { name: 'Save' }).click();
    await expect(account.getByText('Password changed.')).toBeVisible();

    // No reload here: loginAsNewUser() puts its first session back on every page load
    // The new credentials log in; the old ones do not
    const login = (username: string, password: string) =>
      request.post(`${BACKEND_URL}/api/auth/login`, { data: { username, password } });
    expect((await login(renamed, newPassword)).status()).toBe(200);
    expect((await login(renamed, user.password)).status()).toBe(401);
  });

  test('an email that belongs to another account is rejected', async ({ page, request }) => {
    const other = newUser();
    expect((await request.post(`${BACKEND_URL}/api/auth/register`, { data: other })).status()).toBe(201);
    await loginAsNewUser(page, request);

    await page.goto('/settings');
    const account = page.getByRole('region', { name: 'Account' });
    await account.getByRole('button', { name: 'Change email' }).click();
    await account.getByLabel('New email').fill(other.email.toUpperCase());
    await account.getByRole('button', { name: 'Save' }).click();

    await expect(account.getByText('Email is already registered')).toBeVisible();
    await expect(account.getByLabel('New email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('a wrong current password is rejected', async ({ page, request }) => {
    await loginAsNewUser(page, request);

    await page.goto('/settings');
    const account = page.getByRole('region', { name: 'Account' });
    await account.getByRole('button', { name: 'Change password' }).click();
    await account.getByLabel('Current password').fill('not-my-password');
    await account.getByLabel('New password').fill('e2e-new-password-456');
    await account.getByRole('button', { name: 'Save' }).click();

    await expect(account.getByText('Current password is incorrect')).toBeVisible();
  });

  test('a user deletes the account with everything it wrote', async ({ page, request }) => {
    const user = await loginAsNewUser(page, request);
    const login = (password: string) =>
      request.post(`${BACKEND_URL}/api/auth/login`, { data: { username: user.username, password } });
    const { token } = await (await login(user.password)).json();

    // A comment of the user on a seed video, to check it goes with the account
    const videos = await (await request.get(`${BACKEND_URL}/api/videos`, { params: { q: SEED_VIDEOS.city } })).json();
    const videoId = videos.content[0].id;
    const text = `Comment to delete ${Date.now()}`;
    const commented = await request.post(`${BACKEND_URL}/api/videos/${videoId}/comments`, {
      data: { text },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(commented.status()).toBe(201);

    await page.goto('/settings');
    const account = page.getByRole('region', { name: 'Account' });
    await account.getByRole('button', { name: 'Delete account' }).click();
    await account.getByLabel('Password').fill(user.password);
    await account.getByRole('button', { name: 'Delete permanently' }).click();

    // Logged out and back home
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible();
    // The account and its comment are gone
    expect((await login(user.password)).status()).toBe(401);
    const video = await (await request.get(`${BACKEND_URL}/api/videos/${videoId}`)).json();
    expect(video.comments.map((comment: { text: string }) => comment.text)).not.toContain(text);
  });

  test('a wrong password does not delete the account', async ({ page, request }) => {
    const user = await loginAsNewUser(page, request);

    await page.goto('/settings');
    const account = page.getByRole('region', { name: 'Account' });
    await account.getByRole('button', { name: 'Delete account' }).click();
    await account.getByLabel('Password').fill('not-my-password');
    await account.getByRole('button', { name: 'Delete permanently' }).click();

    await expect(account.getByText('Password is incorrect')).toBeVisible();
    await expect(userMenu(page, user.username)).toBeVisible();
    const login = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { username: user.username, password: user.password },
    });
    expect(login.status()).toBe(200);
  });
});
