import { useState, type ReactNode } from 'react';
import { useAuth } from '../auth/authContext';
import {
  DEFAULT_SETTINGS,
  LANGUAGES,
  PLAYBACK_SPEEDS,
  type Settings,
  type TextSize,
  type Theme,
  type VideoQuality,
} from '../settings/settings';
import './SettingsPage.css';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const QUALITIES: { value: VideoQuality; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: '1080p', label: '1080p' },
  { value: '720p', label: '720p' },
  { value: '480p', label: '480p' },
];

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

const SECTIONS = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'language', label: 'Language' },
  { id: 'playback', label: 'Playback' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'account', label: 'Account', requiresUser: true },
];

const SettingsPage = () => {
  const { user } = useAuth();
  // Not applied nor saved yet: each setting only changes this state
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const sections = SECTIONS.filter((section) => !section.requiresUser || user);

  return (
    <div className="settings-page">
      <div className="settings-layout">
        <aside className="settings-nav">
          <h1>Settings</h1>
          <nav aria-label="Settings sections">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="settings-content">
          <div className="settings-notice" role="note">
            <strong>Preview</strong> These settings are not applied or saved yet.
          </div>

          <Section id="appearance" title="Appearance" description="Choose how ProTube looks to you.">
            <Row label="Theme" hint="System follows your device setting.">
              <Segmented
                name="theme"
                label="Theme"
                options={THEMES}
                value={settings.theme}
                onChange={(value) => update('theme', value)}
              />
            </Row>
            <Row label="Text size">
              <Segmented
                name="textSize"
                label="Text size"
                options={TEXT_SIZES}
                value={settings.textSize}
                onChange={(value) => update('textSize', value)}
              />
            </Row>
          </Section>

          <Section id="language" title="Language" description="Language used across the interface.">
            <Row label="Interface language" htmlFor="setting-language">
              <select
                id="setting-language"
                className="form-select"
                value={settings.language}
                onChange={(e) => update('language', e.target.value as Settings['language'])}
              >
                {LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </Row>
          </Section>

          <Section id="playback" title="Playback" description="Default behaviour of the video player.">
            <Row label="Autoplay" hint="Start videos automatically when they open." htmlFor="setting-autoplay">
              <Toggle
                id="setting-autoplay"
                checked={settings.autoplay}
                onChange={(value) => update('autoplay', value)}
              />
            </Row>
            <Row label="Default quality" htmlFor="setting-quality">
              <select
                id="setting-quality"
                className="form-select"
                value={settings.videoQuality}
                onChange={(e) => update('videoQuality', e.target.value as VideoQuality)}
              >
                {QUALITIES.map((quality) => (
                  <option key={quality.value} value={quality.value}>
                    {quality.label}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Playback speed" htmlFor="setting-speed">
              <select
                id="setting-speed"
                className="form-select"
                value={settings.playbackSpeed}
                onChange={(e) => update('playbackSpeed', Number(e.target.value))}
              >
                {PLAYBACK_SPEEDS.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed === 1 ? 'Normal' : `${speed}x`}
                  </option>
                ))}
              </select>
            </Row>
          </Section>

          <Section id="notifications" title="Notifications" description="Decide which emails you want to receive.">
            <Row
              label="Comments on my videos"
              hint="Email me when someone comments on a video I uploaded."
              htmlFor="setting-email-comment"
            >
              <Toggle
                id="setting-email-comment"
                checked={settings.emailOnComment}
                onChange={(value) => update('emailOnComment', value)}
              />
            </Row>
            <Row label="New videos" hint="Email me a summary of new uploads." htmlFor="setting-email-video">
              <Toggle
                id="setting-email-video"
                checked={settings.emailOnNewVideo}
                onChange={(value) => update('emailOnNewVideo', value)}
              />
            </Row>
          </Section>

          <Section id="privacy" title="Privacy" description="Control what other people can see.">
            <Row label="Public profile" hint="Other users can see your profile and videos." htmlFor="setting-public">
              <Toggle
                id="setting-public"
                checked={settings.publicProfile}
                onChange={(value) => update('publicProfile', value)}
              />
            </Row>
            <Row label="Watch history" hint="Keep a list of the videos you watched." htmlFor="setting-history">
              <Toggle
                id="setting-history"
                checked={settings.watchHistory}
                onChange={(value) => update('watchHistory', value)}
              />
            </Row>
          </Section>

          {user && (
            <Section id="account" title="Account" description="Manage your ProTube account.">
              <Row label="Username" hint={user.username}>
                <button type="button" className="btn btn-outline-secondary btn-sm" disabled>
                  Edit profile
                </button>
              </Row>
              <Row label="Email" hint={user.email}>
                <button type="button" className="btn btn-outline-secondary btn-sm" disabled>
                  Change email
                </button>
              </Row>
              <Row label="Password">
                <button type="button" className="btn btn-outline-secondary btn-sm" disabled>
                  Change password
                </button>
              </Row>
              <Row label="Delete account" hint="Permanently remove your account and videos.">
                <button type="button" className="btn btn-outline-danger btn-sm" disabled>
                  Delete account
                </button>
              </Row>
            </Section>
          )}

          <div className="settings-actions">
            <button type="button" className="btn btn-light" onClick={() => setSettings(DEFAULT_SETTINGS)}>
              Reset to defaults
            </button>
            <button type="button" className="settings-save" disabled title="Coming soon">
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
