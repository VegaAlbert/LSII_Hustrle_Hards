import { expect, test } from '@playwright/test';
import { loginAsNewUser, openVideoFromSearch, SEED_VIDEOS } from './support';

test.describe('Favourite videos', () => {
  test('a user saves a video, finds it in the favourites list and removes it', async ({ page, request }) => {
    await loginAsNewUser(page, request);
    const title = SEED_VIDEOS.mountain;

    await page.goto('/favourites');
    await expect(page.getByText('You have no favourite videos yet.')).toBeVisible();

    await openVideoFromSearch(page, title);
    await page.getByRole('button', { name: 'Save to favourites' }).click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();

    // The state is stored by the backend
    await page.reload();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();

    await page.goto('/favourites');
    const favourites = page.getByRole('list', { name: 'Favourite videos' });
    await favourites.getByRole('link', { name: title }).click();
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();

    await page.getByRole('button', { name: 'Saved' }).click();
    await expect(page.getByRole('button', { name: 'Save to favourites' })).toBeVisible();
    await page.goto('/favourites');
    await expect(page.getByText('You have no favourite videos yet.')).toBeVisible();
  });

  test('an anonymous visitor is sent to the login page to save a favourite', async ({ page }) => {
    await openVideoFromSearch(page, SEED_VIDEOS.city);
    await page.getByRole('button', { name: 'Save to favourites' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
