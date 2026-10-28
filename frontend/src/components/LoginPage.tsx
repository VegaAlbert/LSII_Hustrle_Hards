import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/authContext';
import { toApiError } from '../auth/authApi';
import './LoginPage.css';

type Mode = 'login' | 'register';
type FieldErrors = Record<string, string>;

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same rules as RegisterRequest in the backend, checked here to give instant feedback
function validate(mode: Mode, username: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    errors.username = 'Username is required';
  } else if (mode === 'register' && (trimmedUsername.length < 3 || trimmedUsername.length > 30)) {
    errors.username = 'Username must be between 3 and 30 characters';
  } else if (mode === 'register' && !USERNAME_PATTERN.test(trimmedUsername)) {
    errors.username = "Username can only contain letters, numbers, '.', '_' and '-'";
  }

  if (mode === 'register') {
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'Email is not valid';
    }
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (mode === 'register' && (password.length < 8 || password.length > 72)) {
    errors.password = 'Password must be between 8 and 72 characters';
  }

  return errors;
}

type Props = {
  // Called after a successful login or registration (e.g. to go back to the home page)
  onSuccess: () => void;
};

const LoginPage = ({ onSuccess }: Props) => {
  const { login, register } = useAuth();
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

    const errors = validate(mode, username, email, password);
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
      const apiError = toApiError(error);
      setFieldErrors(apiError.fieldErrors);
      setFormError(apiError.message);
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
          <h2>Your videos, your community.</h2>
          <p>Join ProTube to upload your own videos and talk about them with other students.</p>
          <ul className="auth-features">
            <li>Watch videos from the whole community</li>
            <li>Upload and share your own content</li>
            <li>Comment and join the conversation</li>
          </ul>
        </div>
      </aside>

      <main className="auth-form-panel">
        <div className="auth-card">
          <img src="/protube-logo.svg" className="auth-card-logo" alt="ProTube" />
          <h1>{isRegister ? 'Create account' : 'Log in'}</h1>
          <p className="auth-subtitle">
            {isRegister ? 'It only takes a minute to get started.' : 'Welcome back! Please enter your details.'}
          </p>

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
                placeholder="Username"
              />
              <label htmlFor="username">Username</label>
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
                  placeholder="Email"
                />
                <label htmlFor="email">Email</label>
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
                placeholder="Password"
              />
              <label htmlFor="password">Password</label>
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
              <div className="invalid-feedback">{fieldErrors.password}</div>
              {isRegister && !fieldErrors.password && <div className="auth-hint">At least 8 characters.</div>}
            </div>

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              {isRegister ? 'Register' : 'Login'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" className="btn btn-link p-0 align-baseline" onClick={switchMode}>
              {isRegister ? 'Log in' : 'Register'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
