import { createContext, useContext } from 'react';
import type { AuthResponse, User } from './authApi';

export type AuthContextValue = {
  // null when nobody is logged in
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  // credential: the Google ID token returned by the "Sign in with Google" button
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  // Replaces the session with the one returned by a change in the account settings (new token and user)
  updateSession: (session: AuthResponse) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
