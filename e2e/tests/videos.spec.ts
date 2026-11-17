import { expect, test } from '@playwright/test';
import { expectVideoToPlay, openVideoFromSearch, SEED_VIDEOS } from './support';

test.describe('Browse, search and play videos', () => {
  test('the home page lists the videos of the store', async ({ page }) => {
    await page.goto('/');
    const grid = page.getByRole('list', { name: 'Videos' });
    await expect(grid.getByRole('link', { name: SEED_VIDEOS.mountain })).toBeVisible();
    await expect(grid.getByRole('link', { name: SEED_VIDEOS.city })).toBeVisible();
  });

  test('searching by title shows only the matching videos and keeps the search in the URL', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Search videos' }).fill('mountain');
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    await expect(page).toHaveURL(/\?q=mountain$/);
    const results = page.getByRole('list', { name: 'Results for "mountain"' });
    await expect(results.getByRole('link', { name: SEED_VIDEOS.mountain })).toBeVisible();
    await expect(results.getByRole('link', { name: SEED_VIDEOS.city })).toBeHidden();

    // The back button returns to the full list
    await page.goBack();
    await expect(page.getByRole('list', { name: 'Videos' }).getByRole('link', { name: SEED_VIDEOS.city })).toBeVisible();
  });

  test('typing suggests titles and choosing one searches it', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Search videos' }).fill('city');
    await page.getByRole('listbox', { name: 'Suggestions' }).getByRole('option', { name: SEED_VIDEOS.city }).click();

    await expect(page.getByRole('list', { name: `Results for "${SEED_VIDEOS.city}"` })).toBeVisible();
  });

  test('a search without matches says so', async ({ page }) => {
    await page.goto('/?q=zzzz-no-such-video');
    await expect(page.getByText('No videos match "zzzz-no-such-video".')).toBeVisible();
  });

  test('opening a video plays it and shows its details and comments', async ({ page }) => {
    await openVideoFromSearch(page, SEED_VIDEOS.mountain);

    await expectVideoToPlay(page.getByLabel(`Video player: ${SEED_VIDEOS.mountain}`));
    await expect(page.getByText('e2e-seed').first()).toBeVisible();
    await expect(page.getByText('sunrise over the mountains')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Comments' }).getByText('Beautiful colours!')).toBeVisible();
  });

  test('an unknown video shows the not found page', async ({ page }) => {
    await page.goto('/videos/999999');
    await expect(page.getByRole('heading', { name: 'Video not found' })).toBeVisible();
  });
});
