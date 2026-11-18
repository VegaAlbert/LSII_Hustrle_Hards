import {
  applyTextSize,
  DEFAULT_PREFERENCES,
  loadPreferences,
  PREFERENCES_STORAGE_KEY,
  savePreferences,
} from '../preferences';

describe('preferences', () => {
  beforeEach(() => localStorage.clear());

  it('uses the defaults on the first visit', () => {
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it('loads the saved preferences', () => {
    savePreferences({ textSize: 'large', autoplay: false, playbackSpeed: 2 });

    expect(loadPreferences()).toEqual({ textSize: 'large', autoplay: false, playbackSpeed: 2 });
  });

  it('replaces unknown values with their default one by one', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ textSize: 'huge', autoplay: 'yes', playbackSpeed: 1.5 })
    );

    expect(loadPreferences()).toEqual({ ...DEFAULT_PREFERENCES, playbackSpeed: 1.5 });
  });

  it('uses the defaults when the saved value is broken', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, '{not json');

    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it('does not fail when the storage is blocked', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => savePreferences(DEFAULT_PREFERENCES)).not.toThrow();
    setItem.mockRestore();
  });

  it('marks the page with the text size', () => {
    applyTextSize('small');

    expect(document.documentElement).toHaveAttribute('data-text-size', 'small');
  });
});
