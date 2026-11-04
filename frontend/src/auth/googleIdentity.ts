// Minimal types of the Google Identity Services library (https://developers.google.com/identity/gsi/web)
export type GoogleCredentialResponse = { credential: string };

export type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

export const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let loading: Promise<GoogleIdentity> | null = null;

/**
 * Loads Google's "Sign in with Google" script once and resolves with the library when it is ready.
 */
export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google) return Promise.resolve(window.google);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.onload = () => (window.google ? resolve(window.google) : reject(new Error('Google library missing')));
      script.onerror = () => {
        loading = null; // allow a retry on the next attempt
        script.remove();
        reject(new Error('Could not load Google library'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}
