import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../ThemeProvider';
import { useTheme } from '../themeContext';
import { THEME_STORAGE_KEY } from '../themePreference';
import { mockSystemTheme, removeSystemTheme } from '../../test/mockSystemTheme';

const ThemeProbe = () => {
  const { preference, theme, setPreference } = useTheme();
  return (
    <>
      <p>
        Preference {preference}, drawn {theme}
      </p>
      <button type="button" onClick={() => setPreference('dark')}>
        Use dark
      </button>
      <button type="button" onClick={() => setPreference('light')}>
        Use light
      </button>
    </>
  );
};

const renderProvider = () =>
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>
  );

const html = () => document.documentElement;

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    removeSystemTheme();
    html().removeAttribute('data-bs-theme');
  });

  it('follows a dark system on the first visit', () => {
    mockSystemTheme(true);

    renderProvider();

    expect(screen.getByText('Preference system, drawn dark')).toBeInTheDocument();
    expect(html()).toHaveAttribute('data-bs-theme', 'dark');
  });

  it('follows a light system on the first visit', () => {
    mockSystemTheme(false);

    renderProvider();

    expect(screen.getByText('Preference system, drawn light')).toBeInTheDocument();
    expect(html()).toHaveAttribute('data-bs-theme', 'light');
  });

  it('updates the page when the system appearance changes while it is open', () => {
    const switchSystem = mockSystemTheme(false);
    renderProvider();

    act(() => switchSystem(true));

    expect(html()).toHaveAttribute('data-bs-theme', 'dark');
    act(() => switchSystem(false));
    expect(html()).toHaveAttribute('data-bs-theme', 'light');
  });

  it('applies Dark at once and saves it for the next visits', async () => {
    const user = userEvent.setup();
    mockSystemTheme(false);
    const { unmount } = renderProvider();

    await user.click(screen.getByRole('button', { name: 'Use dark' }));

    expect(html()).toHaveAttribute('data-bs-theme', 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    // Reloading the app keeps it
    unmount();
    renderProvider();
    expect(screen.getByText('Preference dark, drawn dark')).toBeInTheDocument();
  });

  it('keeps Light even when the system is dark or turns dark', async () => {
    const user = userEvent.setup();
    const switchSystem = mockSystemTheme(true);
    renderProvider();

    await user.click(screen.getByRole('button', { name: 'Use light' }));
    act(() => switchSystem(true));

    expect(html()).toHaveAttribute('data-bs-theme', 'light');
  });

  it('keeps Dark when the system turns light', async () => {
    const user = userEvent.setup();
    const switchSystem = mockSystemTheme(true);
    renderProvider();

    await user.click(screen.getByRole('button', { name: 'Use dark' }));
    act(() => switchSystem(false));

    expect(html()).toHaveAttribute('data-bs-theme', 'dark');
  });

  it('uses the dark theme when the browser cannot tell the system appearance', () => {
    renderProvider();

    expect(screen.getByText('Preference system, drawn dark')).toBeInTheDocument();
  });

  it('follows a change made in another tab', () => {
    mockSystemTheme(true);
    renderProvider();

    act(() => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY }));
    });

    expect(screen.getByText('Preference light, drawn light')).toBeInTheDocument();
  });

  it('cannot be used outside the provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ThemeProbe />)).toThrow('useTheme must be used inside <ThemeProvider>');

    jest.mocked(console.error).mockRestore();
  });
});
