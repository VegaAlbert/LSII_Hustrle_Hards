import { GOOGLE_SCRIPT_URL, type GoogleIdentity } from '../googleIdentity';

const fakeGoogle = { accounts: { id: { initialize: jest.fn(), renderButton: jest.fn() } } } as GoogleIdentity;

const googleScript = () => document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_URL}"]`);

describe('loadGoogleIdentity', () => {
  // Fresh module each time: it remembers the script it is loading
  let loadGoogleIdentity: () => Promise<GoogleIdentity>;

  beforeEach(() => {
    jest.isolateModules(() => {
      ({ loadGoogleIdentity } = jest.requireActual<typeof import('../googleIdentity')>('../googleIdentity'));
    });
    delete window.google;
    googleScript()?.remove();
  });

  it('uses the library straight away when it is already loaded', async () => {
    window.google = fakeGoogle;

    await expect(loadGoogleIdentity()).resolves.toBe(fakeGoogle);
    expect(googleScript()).toBeNull();
  });

  it('adds the Google script once and resolves when it loads', async () => {
    const first = loadGoogleIdentity();
    const second = loadGoogleIdentity();
    expect(document.querySelectorAll(`script[src="${GOOGLE_SCRIPT_URL}"]`)).toHaveLength(1);

    window.google = fakeGoogle;
    googleScript()!.dispatchEvent(new Event('load'));

    await expect(first).resolves.toBe(fakeGoogle);
    await expect(second).resolves.toBe(fakeGoogle);
  });

  it('fails when the script loads without the library', async () => {
    const loading = loadGoogleIdentity();

    googleScript()!.dispatchEvent(new Event('load'));

    await expect(loading).rejects.toThrow('Google library missing');
  });

  it('fails and allows a retry when the script cannot be downloaded', async () => {
    const loading = loadGoogleIdentity();

    googleScript()!.dispatchEvent(new Event('error'));

    await expect(loading).rejects.toThrow('Could not load Google library');
    expect(googleScript()).toBeNull();
    loadGoogleIdentity();
    expect(googleScript()).not.toBeNull();
  });
});
