import { expect, test } from '@playwright/test';
import { BACKEND_URL } from '../env';
import { loginAsNewUser, newUser, openVideoFromSearch, SEED_VIDEOS, userMenu } from './support';

test.describe('Comment on a video', () => {
  test('a logged-in user comments and the comment is shown first and saved', async ({ page, request }) => {
    const user = await loginAsNewUser(page, request);
    const text = `Great video! (${Date.now()})`;

    await openVideoFromSearch(page, SEED_VIDEOS.city);
    const comments = page.getByRole('list', { name: 'Comments' });

    const commentButton = page.getByRole('button', { name: 'Comment', exact: true });
    await expect(commentButton).toBeDisabled();
    await page.getByLabel('Add a comment').fill(`  ${text}  `);
    await commentButton.click();

    const first = comments.getByRole('listitem').first();
    await expect(first).toContainText(`@${user.username}`);
    await expect(first).toContainText(text);
    await expect(page.getByLabel('Add a comment')).toHaveValue('');

    // It was stored by the backend, not only added to the page
    await page.reload();
    await expect(comments.getByRole('listitem').first()).toContainText(text);
  });

  test('an anonymous visitor logs in from the video and comes back to comment', async ({ page, request }) => {
    const user = newUser();
    const created = await request.post(`${BACKEND_URL}/api/auth/register`, { data: user });
    expect(created.status()).toBe(201);

    await openVideoFromSearch(page, SEED_VIDEOS.mountain);
    const videoUrl = page.url();
    await expect(page.getByLabel('Add a comment')).toBeHidden();
    await page.getByRole('link', { name: 'Log in to comment' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await expect(page).toHaveURL(videoUrl);
    await expect(userMenu(page, user.username)).toBeVisible();
    await page.getByLabel('Add a comment').fill('Logged in just to say hi');
    await page.getByRole('button', { name: 'Comment', exact: true }).click();
    await expect(page.getByRole('list', { name: 'Comments' }).getByRole('listitem').first()).toContainText(
      'Logged in just to say hi'
    );
  });
});
