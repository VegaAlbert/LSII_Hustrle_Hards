import type { AuthResponse } from './authApi';

// The logged-in session is kept in localStorage so it survives page reloads
const STORAGE_KEY = 'protube.session';

export type Session = AuthResponse;

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Reads the expiration date stored inside the JWT (its middle part is base64url-encoded JSON).
 * @return the expiration as epoch milliseconds, or null if the token can't be read
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: unknown };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  return expiration === null || expiration <= Date.now();
}
