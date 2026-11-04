import { useEffect, useRef } from 'react';
import { getEnv } from '../utils/Env';
import { loadGoogleIdentity } from '../auth/googleIdentity';

type Props = {
  // Receives the Google ID token once the user picks an account
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
};

/**
 * "Sign in with Google" button rendered by Google's own library. Shows nothing if no client id is configured.
 */
const GoogleLoginButton = ({ onCredential, onError }: Props) => {
  const clientId = getEnv().GOOGLE_CLIENT_ID;
  const containerRef = useRef<HTMLDivElement>(null);
  // Google keeps the first callback it gets, so it reads the latest props through refs
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
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
        google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 340,
        });
      })
      .catch(() => {
        if (!cancelled) onErrorRef.current('Google login is not available right now. Please try again later.');
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!clientId) return null;

  return (
    <>
      <div className="auth-divider">or</div>
      <div ref={containerRef} className="auth-google" />
    </>
  );
};

export default GoogleLoginButton;
