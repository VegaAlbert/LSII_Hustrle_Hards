import { expect, test } from '@playwright/test';
import { loginAsNewUser, registerNewUser, uploadVideoAs } from './support';

test.describe('Rate a video', () => {
  test('a user rates a video, sees the average and changes the rating', async ({ page, request }) => {
    // A video of its own, so ratings from tests running in parallel don't change the average
    const owner = await registerNewUser(request, 'rated');
    const videoId = await uploadVideoAs(request, owner, `E2E rating ${Date.now()}`);
    await loginAsNewUser(page, request);

    await page.goto(`/videos/${videoId}`);
    const rating = page.getByRole('region', { name: 'Rating' });
    await expect(rating).toContainText('No ratings yet');

    const stars = rating.getByRole('radiogroup', { name: 'Your rating' });
    await stars.getByRole('radio', { name: '4 stars' }).click();
    await expect(rating.getByRole('status')).toHaveText('Thanks! Your rating was saved.');
    await expect(rating).toContainText('4.0/5');
    await expect(rating).toContainText('(1 rating)');

    // Stored by the backend: after reloading, the user's score is still selected
    await page.reload();
    await expect(stars.getByRole('radio', { name: '4 stars' })).toBeChecked();

    await stars.getByRole('radio', { name: '2 stars' }).click();
    await expect(rating.getByRole('status')).toHaveText('Your rating was updated.');
    await expect(rating).toContainText('2.0/5');
    await expect(rating).toContainText('(1 rating)');
  });

  test('an anonymous visitor is asked to log in to rate', async ({ page, request }) => {
    const owner = await registerNewUser(request, 'rated');
    const videoId = await uploadVideoAs(request, owner, `E2E rating anonymous ${Date.now()}`);

    await page.goto(`/videos/${videoId}`);
    const rating = page.getByRole('region', { name: 'Rating' });
    await expect(rating.getByRole('radiogroup', { name: 'Your rating' })).toBeHidden();
    await rating.getByRole('link', { name: 'Log in to rate this video' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
