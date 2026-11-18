import { expect, test } from '@playwright/test';

test.describe('Theme', () => {
  test('a visitor switches between light and dark and the choice is remembered', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const html = page.locator('html');
    // Following the system by default
    await expect(page.getByRole('button', { name: 'Theme: System' })).toBeVisible();
    await expect(html).toHaveAttribute('data-bs-theme', 'dark');

    await page.getByRole('button', { name: 'Theme: System' }).click();
    await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Light' }).click();
    await expect(html).toHaveAttribute('data-bs-theme', 'light');

    await page.reload();
    await expect(html).toHaveAttribute('data-bs-theme', 'light');
    await expect(page.getByRole('button', { name: 'Theme: Light' })).toBeVisible();

    await page.getByRole('button', { name: 'Theme: Light' }).click();
    await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Dark' }).click();
    await expect(html).toHaveAttribute('data-bs-theme', 'dark');
  });
});
