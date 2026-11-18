import { usePopupMenu } from '../hooks/usePopupMenu';
import { useTranslation } from '../i18n/i18nContext';
import { LANGUAGES, type Language } from '../settings/settings';

/**
 * Language switch of the navbar: a globe button with the current language (EN, ES, CA) that opens the list of
 * languages, each written in its own language so anyone can find theirs. The choice applies at once and is saved.
 */
const LanguageMenu = () => {
  const { language, setLanguage, t } = useTranslation();
  const { open, toggle, close, container, button } = usePopupMenu();
  const current = LANGUAGES.find((option) => option.value === language)?.label ?? language;

  const choose = (value: Language) => {
    setLanguage(value);
    close();
  };

  return (
    <div className="pt-theme" ref={container}>
      <button
        ref={button}
        type="button"
        className="pt-icon-btn pt-language-btn"
        aria-label={t('nav.languageCurrent', { language: current })}
        title={t('nav.languageCurrent', { language: current })}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.93 6h-2.95a15.6 15.6 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14a8.2 8.2 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.07 16zm2.95-8H5.07a7.99 7.99 0 0 1 4.33-3.56A15.6 15.6 0 0 0 8.02 8zM12 19.96A14.1 14.1 0 0 1 10.09 16h3.82A14.1 14.1 0 0 1 12 19.96zM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38a8.2 8.2 0 0 1 0 4h-3.38z"
          />
        </svg>
        <span className="pt-language-code" aria-hidden="true">
          {language.toUpperCase()}
        </span>
      </button>
      {open && (
        <ul className="pt-menu pt-theme-menu" role="group" aria-label={t('nav.language')}>
          {LANGUAGES.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                lang={option.value}
                className="pt-menu-item pt-theme-option"
                aria-pressed={language === option.value}
                onClick={() => choose(option.value)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageMenu;
