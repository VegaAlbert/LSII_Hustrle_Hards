import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/authContext';
import { toApiError } from '../auth/authApi';
import { useTranslation } from '../i18n/i18nContext';
import type { TranslateFn } from '../i18n/translate';
import GoogleLoginButton from './GoogleLoginButton';
import './LoginPage.css';

type Mode = 'login' | 'register';
type FieldErrors = Record<string, string>;

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same rules as RegisterRequest in the backend, checked here to give instant feedback
function validate(mode: Mode, username: string, email: string, password: string, t: TranslateFn): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    errors.username = t('auth.usernameRequired');
  } else if (mode === 'register' && (trimmedUsername.length < 3 || trimmedUsername.length > 30)) {
    errors.username = t('auth.usernameLength');
  } else if (mode === 'register' && !USERNAME_PATTERN.test(trimmedUsername)) {
    errors.username = t('auth.usernamePattern');
  }

  if (mode === 'register') {
    if (!email.trim()) {
      errors.email = t('auth.emailRequired');
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = t('auth.emailInvalid');
    }
  }

  if (!password) {
    errors.password = t('auth.passwordRequired');
  } else if (mode === 'register' && (password.length < 8 || password.length > 72)) {
    errors.password = t('auth.passwordLength');
  }

  return errors;
}

type Props = {
  // Called after a successful login or registration (e.g. to go back to the home page)
  onSuccess: () => void;
};

const LoginPage = ({ onSuccess }: Props) => {
  const { login, register, loginWithGoogle } = useAuth();
  const { t, language } = useTranslation();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setFieldErrors({});
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const errors = validate(mode, username, email, password, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      if (isRegister) {
        await register(username.trim(), email.trim(), password);
      } else {
        await login(username.trim(), password);
      }
      onSuccess();
    } catch (error) {
      const apiError = toApiError(error, language);
      setFieldErrors(apiError.fieldErrors);
      setFormError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await loginWithGoogle(credential);
      onSuccess();
    } catch (error) {
      setFormError(toApiError(error, language).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: string) => `form-control${fieldErrors[field] ? ' is-invalid' : ''}`;

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <div className="auth-brand-content">
          <img src="/protube-logo.svg" className="auth-brand-logo" alt="" />
          <h2>{t('auth.brandTitle')}</h2>
          <p>{t('auth.brandText')}</p>
          <ul className="auth-features">
            <li>{t('auth.featureWatch')}</li>
            <li>{t('auth.featureUpload')}</li>
            <li>{t('auth.featureComment')}</li>
          </ul>
        </div>
      </aside>

      <main className="auth-form-panel">
        <div className="auth-card">
          <img src="/protube-logo.svg" className="auth-card-logo" alt="ProTube" />
          <h1>{isRegister ? t('auth.createAccountTitle') : t('auth.loginTitle')}</h1>
          <p className="auth-subtitle">{isRegister ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}</p>

          {formError && (
            <div className="alert alert-danger" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-floating mb-3">
              <input
                id="username"
                className={inputClass('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder={t('auth.username')}
              />
              <label htmlFor="username">{t('auth.username')}</label>
              <div className="invalid-feedback">{fieldErrors.username}</div>
            </div>

            {isRegister && (
              <div className="form-floating mb-3">
                <input
                  id="email"
                  type="email"
                  className={inputClass('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder={t('auth.email')}
                />
                <label htmlFor="email">{t('auth.email')}</label>
                <div className="invalid-feedback">{fieldErrors.email}</div>
              </div>
            )}

            <div className="form-floating auth-password mb-3">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={inputClass('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder={t('auth.password')}
              />
              <label htmlFor="password">{t('auth.password')}</label>
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? t('auth.hide') : t('auth.show')}
              </button>
              <div className="invalid-feedback">{fieldErrors.password}</div>
              {isRegister && !fieldErrors.password && <div className="auth-hint">{t('auth.passwordHint')}</div>}
            </div>

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              {isRegister ? t('auth.registerButton') : t('auth.loginButton')}
            </button>
          </form>

          <GoogleLoginButton onCredential={handleGoogleCredential} onError={setFormError} />

          <p className="auth-switch">
            {isRegister ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
            <button type="button" className="btn btn-link p-0 align-baseline" onClick={switchMode}>
              {isRegister ? t('auth.switchToLogin') : t('auth.switchToRegister')}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
