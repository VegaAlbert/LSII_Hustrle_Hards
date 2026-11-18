import { usePopupMenu } from '../hooks/usePopupMenu';
import { useTranslation } from '../i18n/i18nContext';
import type { MessageKey } from '../i18n/messages';
import { THEME_OPTIONS, type Theme } from '../settings/settings';
import { useTheme } from '../theme/themeContext';
import ThemeIcon from './ThemeIcon';

const THEME_LABEL_KEYS: Record<Theme, MessageKey> = {
  light: 'nav.themeLight',
  dark: 'nav.themeDark',
  system: 'nav.themeSystem',
};

/**
 * Dark mode switch of the navbar: a sun or moon button (the theme in use) that opens Light / Dark / System. Closes
 * after choosing, with Escape (focus goes back to the button) or when clicking anywhere else.
 */
const ThemeMenu = () => {
  const { preference, theme, setPreference } = useTheme();
  const { t } = useTranslation();
  const { open, toggle, close, container, button } = usePopupMenu();
  const current = t(THEME_LABEL_KEYS[preference]);

  const choose = (value: Theme) => {
    setPreference(value);
    close();
  };

  return (
    <div className="pt-theme" ref={container}>
      <button
        ref={button}
        type="button"
        className="pt-icon-btn"
        aria-label={t('nav.themeCurrent', { theme: current })}
        title={t('nav.themeCurrent', { theme: current })}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggle}
      >
        <ThemeIcon theme={theme} size={22} />
      </button>
      {open && (
        <ul className="pt-menu pt-theme-menu" role="group" aria-label={t('nav.theme')}>
          {THEME_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className="pt-menu-item pt-theme-option"
                aria-pressed={preference === option.value}
                onClick={() => choose(option.value)}
              >
                <ThemeIcon theme={option.value} size={18} />
                {t(THEME_LABEL_KEYS[option.value])}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ThemeMenu;
