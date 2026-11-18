import { expect, test } from '@playwright/test';
import { loginAsNewUser, registerNewUser, uploadVideoAs } from './support';

test.describe('Edit video metadata', () => {
  test('the owner edits the description, tags and category and sees them on the video page', async ({
    page,
    request,
  }) => {
    const owner = await loginAsNewUser(page, request);
    const title = `E2E edit ${Date.now()}`;
    const videoId = await uploadVideoAs(request, owner, title);
    const description = `Edited by the E2E suite (${Date.now()})`;

    await page.goto(`/videos/${videoId}`);
    await page.getByRole('link', { name: 'Edit video' }).click();
    await expect(page).toHaveURL(new RegExp(`/videos/${videoId}/edit$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Edit video' })).toBeVisible();

    await page.getByLabel('Description').fill(description);
    await page.getByLabel('Tags').fill('playwright');
    await page.getByLabel('Tags').press('Enter');
    await page.getByLabel('Category').selectOption({ label: 'Music' });
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page).toHaveURL(new RegExp(`/videos/${videoId}$`));
    const expectEdited = async () => {
      await expect(page.getByText(description)).toBeVisible();
      await expect(page.getByRole('list', { name: 'Tags' }).getByRole('link', { name: 'playwright' })).toBeVisible();
      await expect(page.getByText('Music', { exact: true })).toBeVisible();
    };
    await expectEdited();

    // Stored by the backend, not only shown after saving
    await page.reload();
    await expectEdited();
  });

  test('another user cannot edit the video', async ({ page, request }) => {
    const owner = await registerNewUser(request, 'owner');
    const title = `E2E not mine ${Date.now()}`;
    const videoId = await uploadVideoAs(request, owner, title);
    await loginAsNewUser(page, request);

    await page.goto(`/videos/${videoId}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Edit video' })).toBeHidden();

    await page.goto(`/videos/${videoId}/edit`);
    await expect(page.getByRole('alert')).toContainText('You can only edit your own videos.');
    await expect(page.getByRole('button', { name: 'Save' })).toBeHidden();
  });
});
