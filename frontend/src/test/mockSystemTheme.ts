/**
 * Test helper: fakes the operating system appearance seen through window.matchMedia (jsdom has no matchMedia).
 * Returns a function that switches it as the user would in the system settings, firing the "change" event.
 */
export function mockSystemTheme(dark: boolean) {
  let matches = dark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    get matches() {
      return query === '(prefers-color-scheme: dark)' ? matches : false;
    },
    media: query,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
  }));

  return (nowDark: boolean) => {
    matches = nowDark;
    listeners.forEach((listener) => listener({ matches: nowDark } as MediaQueryListEvent));
  };
}

export function removeSystemTheme() {
  // Back to jsdom: no matchMedia at all
  delete (window as Partial<Window>).matchMedia;
}
