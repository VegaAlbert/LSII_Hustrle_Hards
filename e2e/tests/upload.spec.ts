import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { expectVideoToPlay, loginAsNewUser, openVideoFromSearch } from './support';

const SAMPLE_VIDEO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'upload-sample.mp4');

test.describe('Upload a video', () => {
  test('a logged-in user uploads a video that others can find and play', async ({ page, request }) => {
    const user = await loginAsNewUser(page, request);
    const title = `E2E upload ${Date.now()}`;

    await page.goto('/');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/upload$/);
    await expect(page.getByRole('heading', { name: 'Upload video' })).toBeVisible();

    await page.getByLabel('Select video file').setInputFiles(SAMPLE_VIDEO);

    // The title is suggested from the file name; the browser reads the video to offer frames as thumbnails
    const titleInput = page.getByLabel('Title (required)');
    await expect(titleInput).toHaveValue('upload sample');
    await expect(page.getByRole('button', { name: 'Use frame 1 as thumbnail' })).toBeVisible();

    await titleInput.fill(title);
    await page.getByLabel('Description').fill('Uploaded by the E2E suite #playwright');
    await page.getByLabel('Category').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Use frame 2 as thumbnail' }).click();
    await page.getByRole('button', { name: 'Publish' }).click();

    // After publishing, the video page opens and plays the uploaded file
    await expect(page).toHaveURL(/\/videos\/\d+$/);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByText(user.username).first()).toBeVisible();
    await expectVideoToPlay(page.getByLabel(`Video player: ${title}`));

    // The new video is in the catalog: search finds it and it plays again
    await openVideoFromSearch(page, title);
    await expectVideoToPlay(page.getByLabel(`Video player: ${title}`));
  });

  test('a file that is not a video is rejected before uploading', async ({ page, request }) => {
    await loginAsNewUser(page, request);
    await page.goto('/upload');

    await page.getByLabel('Select video file').setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a video'),
    });

    await expect(page.getByRole('alert')).toHaveText('Choose an MP4 or WebM video.');
    await expect(page.getByRole('button', { name: 'Publish' })).toBeHidden();
  });
});
