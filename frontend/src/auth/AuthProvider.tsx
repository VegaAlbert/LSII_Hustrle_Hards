import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import * as authApi from './authApi';
import { AuthContext, type AuthContextValue } from './authContext';
import { clearSession, getTokenExpiration, isTokenExpired, loadSession, saveSession, type Session } from './session';

function initialSession(): Session | null {
  const stored = loadSession();
  return stored && !isTokenExpired(stored.token) ? stored : null;
}

/**
 * Keeps track of the logged-in user for the whole app. Wrap the app with it and read it with useAuth().
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const token = session?.token;

  const logout = useCallback(() => setSession(null), []);

  const login = useCallback(async (username: string, password: string) => {
    setSession(await authApi.login(username, password));
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setSession(await authApi.register(username, email, password));
  }, []);

  // Persist the session and send the token with every axios request to the backend
  useEffect(() => {
    if (session) {
      saveSession(session);
      axios.defaults.headers.common.Authorization = `Bearer ${session.token}`;
    } else {
      clearSession();
      delete axios.defaults.headers.common.Authorization;
    }
  }, [session]);

  // Check with the backend that the token is still accepted (e.g. the user may no longer exist)
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authApi
      .fetchCurrentUser(token)
      .then((user) => {
        if (!cancelled) setSession((current) => (current ? { ...current, user } : current));
      })
      .catch((error: unknown) => {
        // Only drop the session when the backend rejects it, not when it is just unreachable
        if (!cancelled && authApi.isUnauthorized(error)) setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Log out automatically as soon as the token expires
  useEffect(() => {
    if (!token) return;
    const expiration = getTokenExpiration(token);
    if (expiration === null) return;
    const timer = setTimeout(logout, expiration - Date.now());
    return () => clearTimeout(timer);
  }, [token, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, login, register, logout }),
    [session, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
