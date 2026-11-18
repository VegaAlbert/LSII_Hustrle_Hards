import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeMenu from '../ThemeMenu';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { THEME_STORAGE_KEY } from '../../theme/themePreference';
import { mockSystemTheme, removeSystemTheme } from '../../test/mockSystemTheme';

const renderMenu = () =>
  render(
    <ThemeProvider>
      <ThemeMenu />
      <p>Outside</p>
    </ThemeProvider>
  );

describe('ThemeMenu', () => {
  beforeEach(() => {
    localStorage.clear();
    mockSystemTheme(false);
  });

  afterEach(() => removeSystemTheme());

  it('shows the current preference in the name of its button', () => {
    renderMenu();

    expect(screen.getByRole('button', { name: 'Theme: System' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
  });

  it('switches to Dark from the menu and closes it', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Theme: System' }));
    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Dark' }));

    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
    // Focus goes back to the button, now named after the new preference
    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toHaveFocus();
  });

  it('can be used with the keyboard and closed with Escape', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Theme: System' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Light' })).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Theme: System' })).toHaveFocus();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Theme: System' }));
    await user.click(screen.getByText('Outside'));

    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
  });
});
