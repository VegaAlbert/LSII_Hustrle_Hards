import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/authContext';
import { toApiError } from '../auth/authApi';

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
    <div className="container py-5" style={{ maxWidth: 420 }}>
      <h2 className="mb-4">{isRegister ? 'Create account' : 'Log in'}</h2>

      {formError && (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            id="username"
            className={inputClass('username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <div className="invalid-feedback">{fieldErrors.username}</div>
        </div>

        {isRegister && (
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={inputClass('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <div className="invalid-feedback">{fieldErrors.email}</div>
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={inputClass('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          <div className="invalid-feedback">{fieldErrors.password}</div>
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>

      <p className="mt-3 text-center">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button type="button" className="btn btn-link p-0 align-baseline" onClick={switchMode}>
          {isRegister ? 'Log in' : 'Register'}
        </button>
      </p>
    </div>
  );
};

export default LoginPage;
