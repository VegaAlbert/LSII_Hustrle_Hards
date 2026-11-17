import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { BACKEND_URL } from '../env';

export const PASSWORD = 'e2e-password-123';

// Titles of the videos in fixtures/store, imported by the backend on startup
export const SEED_VIDEOS = {
  mountain: 'Mountain Sunrise Timelapse',
  city: 'City Night Walk',
} as const;

export type TestUser = { username: string; email: string; password: string };

/**
 * A user nobody else uses, so tests stay independent even when they run in parallel against the same backend.
 */
export function newUser(prefix = 'e2e'): TestUser {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const username = `${prefix}_${id}`;
  return { username, email: `${username}@protube.test`, password: PASSWORD };
}

/**
 * Registers a user through the API and opens the app already logged in with its session, for tests whose subject
 * is not the login itself.
 */
export async function loginAsNewUser(page: Page, request: APIRequestContext): Promise<TestUser> {
  const user = newUser();
  const response = await request.post(`${BACKEND_URL}/api/auth/register`, { data: user });
  expect(response.status(), await response.text()).toBe(201);
  const session = await response.json();
  // Same key and format as src/auth/session.ts in the frontend
  await page.addInitScript((value) => localStorage.setItem('protube.session', value), JSON.stringify(session));
  return user;
}

export function userMenu(page: Page, username: string): Locator {
  return page.getByRole('button', { name: `User menu for ${username}` });
}

/**
 * Checks that a <video> really plays: the media loaded without errors and its time moves forward.
 */
export async function expectVideoToPlay(player: Locator): Promise<void> {
  await expect(player).toBeVisible();
  await player.evaluate((video: HTMLVideoElement) => video.play());
  await expect
    .poll(() => player.evaluate((video: HTMLVideoElement) => (video.error ? -1 : video.currentTime)), {
      message: 'the video should play without errors',
    })
    .toBeGreaterThan(0);
}

/**
 * Opens a video from the home page using the search box, as a user would.
 */
export async function openVideoFromSearch(page: Page, title: string): Promise<void> {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Search videos' }).fill(title);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page
    .getByRole('list', { name: `Results for "${title}"` })
    .getByRole('link', { name: title })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
}
