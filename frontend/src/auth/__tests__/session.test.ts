import { clearSession, getTokenExpiration, isTokenExpired, loadSession, saveSession } from '../session';

const makeToken = (expSeconds: number) => `header.${btoa(JSON.stringify({ exp: expSeconds }))}.signature`;

const session = { token: 'token', user: { id: 1, username: 'alice', email: 'alice@mail.com' } };

describe('session', () => {
  beforeEach(() => localStorage.clear());

  it('saves, loads and clears the session', () => {
    expect(loadSession()).toBeNull();

    saveSession(session);
    expect(loadSession()).toEqual(session);

    clearSession();
    expect(loadSession()).toBeNull();
  });

  it('ignores a corrupted stored session', () => {
    localStorage.setItem('protube.session', '{not json');

    expect(loadSession()).toBeNull();
  });

  it('reads the expiration of a token', () => {
    expect(getTokenExpiration(makeToken(1000))).toBe(1_000_000);
  });

  it('returns null for unreadable tokens', () => {
    expect(getTokenExpiration('garbage')).toBeNull();
    expect(getTokenExpiration(`header.${btoa('{}')}.signature`)).toBeNull();
  });

  it('knows whether a token is expired', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    expect(isTokenExpired(makeToken(nowSeconds + 60))).toBe(false);
    expect(isTokenExpired(makeToken(nowSeconds - 60))).toBe(true);
    expect(isTokenExpired('garbage')).toBe(true);
  });
});
