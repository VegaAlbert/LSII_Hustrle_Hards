import { createContext, useContext } from 'react';
import type { Theme } from '../settings/settings';
import type { ResolvedTheme } from './themePreference';

export type ThemeContextValue = {
  // What the user chose: light, dark or system (the default)
  preference: Theme;
  // What the page is drawn with right now ("system" already resolved)
  theme: ResolvedTheme;
  setPreference: (preference: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}
