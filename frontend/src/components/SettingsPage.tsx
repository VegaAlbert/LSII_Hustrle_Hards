import { useState, type ReactNode } from 'react';
import { useAuth } from '../auth/authContext';
import {
  DEFAULT_PENDING_SETTINGS,
  LANGUAGES,
  type Language,
  PLAYBACK_SPEEDS,
  TEXT_SIZES,
  THEME_OPTIONS,
  type PendingSettings,
  type TextSize,
  type Theme,
} from '../settings/settings';
import { usePreferences } from '../settings/usePreferences';
import { useTranslation } from '../i18n/i18nContext';
import type { MessageKey } from '../i18n/messages';
import { useTheme } from '../theme/themeContext';
import AccountSettings from './AccountSettings';
import './SettingsPage.css';

const TEXT_SIZE_LABELS: Record<TextSize, MessageKey> = {
  small: 'settings.textSmall',
  medium: 'settings.textMedium',
  large: 'settings.textLarge',
};

const THEME_LABELS: Record<Theme, MessageKey> = {
  light: 'nav.themeLight',
  dark: 'nav.themeDark',
  system: 'nav.themeSystem',
};

type SectionProps = { id: string; title: string; description: string; children: ReactNode };

const Section = ({ id, title, description, children }: SectionProps) => (
  <section id={id} className="settings-section" aria-labelledby={`${id}-title`}>
    <header>
      <h2 id={`${id}-title`}>{title}</h2>
      <p>{description}</p>
    </header>
    <div className="settings-rows">{children}</div>
  </section>
);

type RowProps = { label: string; hint?: string; htmlFor?: string; children: ReactNode };

const Row = ({ label, hint, htmlFor, children }: RowProps) => (
  <div className="settings-row">
    <div className="settings-row-text">
      {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span>{label}</span>}
      {hint && <small>{hint}</small>}
    </div>
    <div className="settings-row-control">{children}</div>
  </div>
);

type ToggleProps = { id: string; checked: boolean; onChange: (checked: boolean) => void };

const Toggle = ({ id, checked, onChange }: ToggleProps) => (
  <div className="form-check form-switch m-0">
    <input
      id={id}
      className="form-check-input settings-switch"
      type="checkbox"
      role="switch"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  </div>
);

type SegmentedProps<T extends string> = {
  name: string;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

const Segmented = <T extends string>({ name, label, options, value, onChange }: SegmentedProps<T>) => (
  <div className="settings-segmented" role="radiogroup" aria-label={label}>
    {options.map((option) => (
      <label key={option.value} className={value === option.value ? 'active' : ''}>
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
        />
        {option.label}
      </label>
    ))}
  </div>
);

const SECTIONS: { id: string; label: MessageKey; requiresUser?: boolean }[] = [
  { id: 'appearance', label: 'settings.appearance' },
  { id: 'language', label: 'settings.language' },
  { id: 'playback', label: 'settings.playback' },
  { id: 'privacy', label: 'settings.privacy' },
  { id: 'account', label: 'settings.account', requiresUser: true },
];

const SettingsPage = () => {
  const { user } = useAuth();
  // The theme lives in ThemeProvider (applied and saved at once)
  const { preference: theme, setPreference: setTheme } = useTheme();
  // The language lives in I18nProvider (applied and saved at once)
  const { t, language, setLanguage } = useTranslation();
  // Text size and playback: applied and saved at once on this device
  const { preferences, update: updatePreference, reset: resetPreferences } = usePreferences();
  // Not applied nor saved yet: privacy only changes this state
  const [settings, setSettings] = useState<PendingSettings>(DEFAULT_PENDING_SETTINGS);

  const resetToDefaults = () => {
    setSettings(DEFAULT_PENDING_SETTINGS);
    resetPreferences();
    setTheme('system');
    setLanguage('en');
  };

  const update = <K extends keyof PendingSettings>(key: K, value: PendingSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const sections = SECTIONS.filter((section) => !section.requiresUser || user);

  return (
    <div className="settings-page">
      <div className="settings-layout">
        <aside className="settings-nav">
          <h1>{t('settings.title')}</h1>
          <nav aria-label={t('settings.sectionsNav')}>
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {t(section.label)}
              </a>
            ))}
          </nav>
        </aside>

        <div className="settings-content">
          <div className="settings-notice" role="note">
            <strong>{t('settings.noticeTitle')}</strong> {t('settings.notice')}
          </div>

          <Section id="appearance" title={t('settings.appearance')} description={t('settings.appearanceDescription')}>
            <Row label={t('settings.theme')} hint={t('settings.themeHint')}>
              <Segmented
                name="theme"
                label={t('settings.theme')}
                options={THEME_OPTIONS.map((option) => ({ value: option.value, label: t(THEME_LABELS[option.value]) }))}
                value={theme}
                onChange={setTheme}
              />
            </Row>
            <Row label={t('settings.textSize')}>
              <Segmented
                name="textSize"
                label={t('settings.textSize')}
                options={TEXT_SIZES.map((size) => ({ value: size.value, label: t(TEXT_SIZE_LABELS[size.value]) }))}
                value={preferences.textSize}
                onChange={(value) => updatePreference('textSize', value)}
              />
            </Row>
          </Section>

          <Section id="language" title={t('settings.language')} description={t('settings.languageDescription')}>
            <Row label={t('settings.interfaceLanguage')} htmlFor="setting-language">
              <select
                id="setting-language"
                className="form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                {LANGUAGES.map((option) => (
                  <option key={option.value} value={option.value} lang={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Row>
          </Section>

          <Section id="playback" title={t('settings.playback')} description={t('settings.playbackDescription')}>
            <Row label={t('settings.autoplay')} hint={t('settings.autoplayHint')} htmlFor="setting-autoplay">
              <Toggle
                id="setting-autoplay"
                checked={preferences.autoplay}
                onChange={(value) => updatePreference('autoplay', value)}
              />
            </Row>
            <Row label={t('settings.speed')} hint={t('settings.speedHint')} htmlFor="setting-speed">
              <select
                id="setting-speed"
                className="form-select"
                value={preferences.playbackSpeed}
                onChange={(e) => updatePreference('playbackSpeed', Number(e.target.value))}
              >
                {PLAYBACK_SPEEDS.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed === 1 ? t('settings.speedNormal') : `${speed.toLocaleString(language)}x`}
                  </option>
                ))}
              </select>
            </Row>
          </Section>

          <Section id="privacy" title={t('settings.privacy')} description={t('settings.privacyDescription')}>
            <Row label={t('settings.publicProfile')} hint={t('settings.publicProfileHint')} htmlFor="setting-public">
              <Toggle
                id="setting-public"
                checked={settings.publicProfile}
                onChange={(value) => update('publicProfile', value)}
              />
            </Row>
            <Row label={t('settings.watchHistory')} hint={t('settings.watchHistoryHint')} htmlFor="setting-history">
              <Toggle
                id="setting-history"
                checked={settings.watchHistory}
                onChange={(value) => update('watchHistory', value)}
              />
            </Row>
          </Section>

          {user && (
            <Section id="account" title={t('settings.account')} description={t('settings.accountDescription')}>
              <AccountSettings user={user} />
            </Section>
          )}

          <div className="settings-actions">
            <button type="button" className="btn btn-light" onClick={resetToDefaults}>
              {t('settings.reset')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
