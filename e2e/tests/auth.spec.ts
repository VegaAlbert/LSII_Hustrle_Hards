import { expect, test } from '@playwright/test';
import { BACKEND_URL } from '../env';
import { newUser, userMenu } from './support';

test.describe('Authentication', () => {
  test('a visitor registers, logs out and logs in again', async ({ page }) => {
    const user = newUser();

    await page.goto('/');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Register
    await page.getByRole('button', { name: 'Register', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Register', exact: true }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(userMenu(page, user.username)).toBeVisible();

    // The session survives a reload
    await page.reload();
    await expect(userMenu(page, user.username)).toBeVisible();

    // Logout
    await userMenu(page, user.username).click();
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible();
    await expect(userMenu(page, user.username)).toBeHidden();

    // Login
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(userMenu(page, user.username)).toBeVisible();
  });

  test('a wrong password is rejected', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('nobody_e2e');
    await page.getByLabel('Password', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await expect(page.getByRole('alert')).toHaveText('Invalid username or password');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('registering an existing username shows the error of the backend', async ({ page, request }) => {
    const user = newUser();
    const created = await request.post(`${BACKEND_URL}/api/auth/register`, { data: user });
    expect(created.status()).toBe(201);

    await page.goto('/login');
    await page.getByRole('button', { name: 'Register', exact: true }).click();
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Email').fill(`other-${user.email}`);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Register', exact: true }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('an anonymous visitor who wants to upload is sent to the login page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  });
});
