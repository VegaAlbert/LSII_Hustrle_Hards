import { expect, test } from '@playwright/test';
import { SEED_VIDEOS } from './support';

test.describe('Internationalization', () => {
  test('a visitor switches the interface to Catalan and it stays after a reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('button', { name: 'Language: English' }).click();
    await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'Català' }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
    await expect(page.getByRole('button', { name: 'Idioma: Català' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inicia la sessió', exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Cerca vídeos' })).toBeVisible();
    // The content of the videos is not translated, only the interface around it
    await expect(
      page.getByRole('list', { name: 'Vídeos' }).getByRole('link', { name: SEED_VIDEOS.mountain })
    ).toBeVisible();

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
    await expect(page.getByRole('button', { name: 'Inicia la sessió', exact: true })).toBeVisible();
  });

  test('the language chosen in Settings also translates the errors of the backend', async ({ page }) => {
    await page.goto('/settings');
    await page.getByLabel('Interface language').selectOption('es');
    await expect(page.getByRole('heading', { level: 1, name: 'Configuración' })).toBeVisible();

    await page.goto('/login');
    await page.getByLabel('Nombre de usuario').fill('nobody_e2e');
    await page.getByLabel('Contraseña', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos');
  });

  test.describe('with a browser in Spanish', () => {
    test.use({ locale: 'es-ES' });

    test('ProTube opens in Spanish on the first visit', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      await expect(page.getByRole('button', { name: 'Idioma: Español' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
    });
  });
});
