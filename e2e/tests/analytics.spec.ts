import { expect, test } from '@playwright/test';
import { loginAsNewUser, uploadVideoAs } from './support';

test.describe('Analytics of my videos', () => {
  test('a user without videos sees the empty state', async ({ page, request }) => {
    await loginAsNewUser(page, request);

    await page.goto('/analytics');
    await expect(page.getByRole('heading', { level: 1, name: 'Analytics' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No analytics yet' })).toBeVisible();
  });

  test('the owner sees the views of a video watched by a visitor', async ({ page, request, browser }) => {
    const owner = await loginAsNewUser(page, request);
    const title = `E2E analytics ${Date.now()}`;
    const videoId = await uploadVideoAs(request, owner, title);

    // An anonymous visitor in another browser opens the video, which counts a view
    const visitor = await browser.newPage();
    await visitor.goto(`/videos/${videoId}`);
    await expect(visitor.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await visitor.close();

    await page.goto('/analytics');
    const totals = page.getByRole('list', { name: 'Totals' });
    await expect(totals.getByRole('listitem').filter({ hasText: 'Videos' })).toHaveText(/Videos\s*1$/);
    await expect(totals.getByRole('listitem').filter({ hasText: 'Total views' })).not.toHaveText(/Total views\s*0$/);

    const videos = page.getByRole('region', { name: 'Your videos' });
    await expect(videos.getByRole('row').filter({ hasText: title })).toBeVisible();
    await videos.getByRole('link', { name: title }).click();
    await expect(page).toHaveURL(new RegExp(`/videos/${videoId}$`));
  });
});
