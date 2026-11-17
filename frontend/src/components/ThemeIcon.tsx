import type { Theme } from '../settings/settings';

const PATHS: Record<Theme, string> = {
  // Sun
  light:
    'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zM3 11h2a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2zm16 0h2a1 1 0 1 1 0 2h-2a1 1 0 1 1 0-2zM5.64 4.22l1.42 1.42a1 1 0 0 1-1.42 1.42L4.22 5.64a1 1 0 0 1 1.42-1.42zm12.72 12.72 1.42 1.42a1 1 0 0 1-1.42 1.42l-1.42-1.42a1 1 0 0 1 1.42-1.42zM4.22 18.36l1.42-1.42a1 1 0 1 1 1.42 1.42l-1.42 1.42a1 1 0 0 1-1.42-1.42zM16.94 5.64l1.42-1.42a1 1 0 1 1 1.42 1.42l-1.42 1.42a1 1 0 0 1-1.42-1.42z',
  // Moon
  dark: 'M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z',
  // Monitor
  system: 'M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6v2h3v2H7v-2h3v-2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v10h16V6z',
};

/**
 * Icon of a theme option: sun for light, moon for dark and a monitor for "same as the system". Decorative: the text
 * next to it or the label of its button names the option.
 */
const ThemeIcon = ({ theme, size = 20 }: { theme: Theme; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path fill="currentColor" d={PATHS[theme]} />
  </svg>
);

export default ThemeIcon;
