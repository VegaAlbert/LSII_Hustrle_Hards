import { useEffect, useRef } from 'react';
import { getEnv } from '../utils/Env';
import { loadGoogleIdentity } from '../auth/googleIdentity';
import { useTranslation } from '../i18n/i18nContext';

type Props = {
  // Receives the Google ID token once the user picks an account
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
};

/**
 * "Sign in with Google" button rendered by Google's own library. Shows nothing if no client id is configured.
 */
const GoogleLoginButton = ({ onCredential, onError }: Props) => {
  const { t, language } = useTranslation();
  const clientId = getEnv().GOOGLE_CLIENT_ID;
  const containerRef = useRef<HTMLDivElement>(null);
  // Google keeps the first callback it gets, so it reads the latest props through refs
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const unavailableRef = useRef(t('auth.googleUnavailable'));

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
    unavailableRef.current = t('auth.googleUnavailable');
  });

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGoogleIdentity()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredentialRef.current(response.credential),
        });
        // Drawn again in the new language when it changes
        containerRef.current.replaceChildren();
        google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 340,
          locale: language,
        });
      })
      .catch(() => {
        if (!cancelled) onErrorRef.current(unavailableRef.current);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, language]);

  if (!clientId) return null;

  return (
    <>
      <div className="auth-divider">{t('auth.or')}</div>
      <div ref={containerRef} className="auth-google" />
    </>
  );
};

export default GoogleLoginButton;
