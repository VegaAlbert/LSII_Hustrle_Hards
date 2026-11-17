import { useEffect, useRef, useState } from 'react';
import { THEME_OPTIONS, type Theme } from '../settings/settings';
import { useTheme } from '../theme/themeContext';
import ThemeIcon from './ThemeIcon';

/**
 * Dark mode switch of the navbar: a sun or moon button (the theme in use) that opens Light / Dark / System. Closes
 * after choosing, with Escape (focus goes back to the button) or when clicking anywhere else.
 */
const ThemeMenu = () => {
  const { preference, theme, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const current = THEME_OPTIONS.find((option) => option.value === preference)?.label ?? 'System';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const choose = (value: Theme) => {
    setPreference(value);
    setOpen(false);
    button.current?.focus();
  };

  return (
    <div className="pt-theme" ref={container}>
      <button
        ref={button}
        type="button"
        className="pt-icon-btn"
        aria-label={`Theme: ${current}`}
        title={`Theme: ${current}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <ThemeIcon theme={theme} size={22} />
      </button>
      {open && (
        <ul className="pt-menu pt-theme-menu" role="group" aria-label="Theme">
          {THEME_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className="pt-menu-item pt-theme-option"
                aria-pressed={preference === option.value}
                onClick={() => choose(option.value)}
              >
                <ThemeIcon theme={option.value} size={18} />
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ThemeMenu;
