import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { BACKEND_URL } from '../env';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

export const PASSWORD = 'e2e-password-123';

// Titles of the videos in fixtures/store, imported by the backend on startup
export const SEED_VIDEOS = {
  mountain: 'Mountain Sunrise Timelapse',
  city: 'City Night Walk',
} as const;

export type TestUser = { username: string; email: string; password: string };

/** A user registered through the API, with the JWT of its session. */
export type RegisteredUser = TestUser & { token: string };

/**
 * A user nobody else uses, so tests stay independent even when they run in parallel against the same backend.
 */
export function newUser(prefix = 'e2e'): TestUser {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const username = `${prefix}_${id}`;
  return { username, email: `${username}@protube.test`, password: PASSWORD };
}

/**
 * Registers a new user through the API, for tests whose subject is not the registration itself.
 */
export async function registerNewUser(request: APIRequestContext, prefix = 'e2e'): Promise<RegisteredUser> {
  const user = newUser(prefix);
  const response = await request.post(`${BACKEND_URL}/api/auth/register`, { data: user });
  expect(response.status(), await response.text()).toBe(201);
  const { token } = await response.json();
  return { ...user, token };
}

/**
 * Registers a user through the API and opens the app already logged in with its session, for tests whose subject
 * is not the login itself.
 */
export async function loginAsNewUser(page: Page, request: APIRequestContext): Promise<RegisteredUser> {
  const user = newUser();
  const response = await request.post(`${BACKEND_URL}/api/auth/register`, { data: user });
  expect(response.status(), await response.text()).toBe(201);
  const session = await response.json();
  // Same key and format as src/auth/session.ts in the frontend
  await page.addInitScript((value) => localStorage.setItem('protube.session', value), JSON.stringify(session));
  return { ...user, token: session.token };
}

/**
 * Uploads a video as the given user through the API, for tests whose subject is not the upload. Returns its id.
 */
export async function uploadVideoAs(request: APIRequestContext, user: RegisteredUser, title: string): Promise<number> {
  const uploaded = await request.post(`${BACKEND_URL}/api/videos`, {
    headers: { Authorization: `Bearer ${user.token}` },
    multipart: {
      metadata: {
        name: 'metadata.json',
        mimeType: 'application/json',
        buffer: Buffer.from(
          JSON.stringify({ title, description: '', tags: [], category: null, ageRestricted: false, durationSeconds: 1 })
        ),
      },
      video: {
        name: 'upload-sample.mp4',
        mimeType: 'video/mp4',
        buffer: fs.readFileSync(path.join(FIXTURES, 'upload-sample.mp4')),
      },
      thumbnail: {
        name: 'thumbnail.webp',
        mimeType: 'image/webp',
        buffer: fs.readFileSync(path.join(FIXTURES, 'store', 'e2e-city-night.webp')),
      },
    },
  });
  expect(uploaded.status(), await uploaded.text()).toBe(201);
  const { id } = await uploaded.json();
  return id as number;
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
