import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeEmail, changePassword, changeUsername, deleteAccount } from '../account/accountApi';
import { toApiError, type AuthResponse, type User } from '../auth/authApi';
import { useAuth } from '../auth/authContext';

type Field = { name: string; label: string; type: 'text' | 'email' | 'password'; autoComplete: string };

type AccountRowProps = {
  id: string;
  label: string;
  hint?: string;
  buttonLabel: string;
  fields: Field[];
  // Initial values of the fields when the form opens
  initialValues?: Record<string, string>;
  submit: (values: Record<string, string>) => Promise<AuthResponse>;
  successMessage: string;
};

/**
 * One setting of the account: shows its current value and, after clicking the button, a small form to change it.
 * Errors of the backend are shown next to their field (or above the form) and the form stays open.
 */
const AccountRow = ({
  id,
  label,
  hint,
  buttonLabel,
  fields,
  initialValues = {},
  submit,
  successMessage,
}: AccountRowProps) => {
  const { updateSession } = useAuth();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const openForm = () => {
    setValues(initialValues);
    setFieldErrors({});
    setFormError(null);
    setSaved(false);
    setOpen(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);
    try {
      updateSession(await submit(values));
      setOpen(false);
      setSaved(true);
    } catch (error) {
      const apiError = toApiError(error);
      // Errors of fields this form does not show (or none) go above the form
      const known = Object.fromEntries(
        Object.entries(apiError.fieldErrors).filter(([name]) => fields.some((field) => field.name === name))
      );
      setFieldErrors(known);
      if (Object.keys(known).length === 0) setFormError(apiError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <span id={`${id}-label`}>{label}</span>
        {hint && <small>{hint}</small>}
        {saved && (
          <small role="status" className="settings-success">
            {successMessage}
          </small>
        )}
      </div>
      {open ? (
        <form className="settings-account-form" aria-labelledby={`${id}-label`} onSubmit={onSubmit} noValidate>
          {formError && (
            <div className="alert alert-danger py-2 mb-0" role="alert">
              {formError}
            </div>
          )}
          {fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={`${id}-${field.name}`} className="form-label">
                {field.label}
              </label>
              <input
                id={`${id}-${field.name}`}
                className={`form-control form-control-sm${fieldErrors[field.name] ? ' is-invalid' : ''}`}
                type={field.type}
                autoComplete={field.autoComplete}
                value={values[field.name] ?? ''}
                onChange={(e) => setValues((current) => ({ ...current, [field.name]: e.target.value }))}
                aria-invalid={Boolean(fieldErrors[field.name])}
              />
              <div className="invalid-feedback">{fieldErrors[field.name]}</div>
            </div>
          ))}
          <div className="settings-account-actions">
            <button type="button" className="btn btn-light btn-sm" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="settings-save btn-sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={openForm}>
          {buttonLabel}
        </button>
      )}
    </div>
  );
};

/**
 * Last row of the account: deletes it with everything it owns, after confirming with the password (or, for Google
 * accounts without one, by typing the username). Then the user is logged out and sent home.
 */
const DeleteAccountRow = ({ user, hasPassword }: { user: User; hasPassword: boolean }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const field = hasPassword ? 'password' : 'confirmation';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount({ [field]: value });
      logout();
      navigate('/', { replace: true });
    } catch (e) {
      const apiError = toApiError(e);
      setError(apiError.fieldErrors[field] ?? apiError.message);
      setDeleting(false);
    }
  };

  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <span id="account-delete-label">Delete account</span>
        <small>Permanently remove your account and videos.</small>
      </div>
      {open ? (
        <form className="settings-account-form" aria-labelledby="account-delete-label" onSubmit={onSubmit} noValidate>
          <p className="settings-danger-text mb-0">
            This deletes your account, your videos with their comments, your comments with their replies, and your
            ratings, favourites and subscriptions. It cannot be undone.
          </p>
          <div>
            <label htmlFor="account-delete-input" className="form-label">
              {hasPassword ? 'Password' : `Type ${user.username} to confirm`}
            </label>
            <input
              id="account-delete-input"
              className={`form-control form-control-sm${error ? ' is-invalid' : ''}`}
              type={hasPassword ? 'password' : 'text'}
              autoComplete={hasPassword ? 'current-password' : 'off'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={Boolean(error)}
            />
            <div className="invalid-feedback">{error}</div>
          </div>
          <div className="settings-account-actions">
            <button type="button" className="btn btn-light btn-sm" onClick={() => setOpen(false)} disabled={deleting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger btn-sm" disabled={deleting || value === ''}>
              {deleting ? 'Deleting...' : 'Delete permanently'}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          onClick={() => {
            setValue('');
            setError(null);
            setOpen(true);
          }}
        >
          Delete account
        </button>
      )}
    </div>
  );
};

/**
 * Account section of the settings: change the username, email and password, or delete the account. Accounts created with "Sign in with
 * Google" can change them too; they set their first password without a current one.
 */
const AccountSettings = ({ user }: { user: User }) => {
  // Sessions saved before the field existed have no value: ask for the current password to be safe
  const hasPassword = user.hasPassword !== false;

  return (
    <>
      <AccountRow
        id="account-username"
        label="Username"
        hint={user.username}
        buttonLabel="Change username"
        fields={[{ name: 'username', label: 'New username', type: 'text', autoComplete: 'username' }]}
        initialValues={{ username: user.username }}
        submit={(values) => changeUsername(values.username ?? '')}
        successMessage="Username updated."
      />
      <AccountRow
        id="account-email"
        label="Email"
        hint={user.googleLinked ? `${user.email} · Google sign-in enabled` : user.email}
        buttonLabel="Change email"
        fields={[{ name: 'email', label: 'New email', type: 'email', autoComplete: 'email' }]}
        initialValues={{ email: user.email }}
        submit={(values) => changeEmail(values.email ?? '')}
        successMessage="Email updated."
      />
      <AccountRow
        id="account-password"
        label="Password"
        hint={
          hasPassword
            ? 'At least 8 characters.'
            : 'Your account uses Google sign-in. Set a password to also log in with your username.'
        }
        buttonLabel={hasPassword ? 'Change password' : 'Set password'}
        fields={[
          ...(hasPassword
            ? [
                {
                  name: 'currentPassword',
                  label: 'Current password',
                  type: 'password',
                  autoComplete: 'current-password',
                } as const,
              ]
            : []),
          { name: 'newPassword', label: 'New password', type: 'password', autoComplete: 'new-password' },
        ]}
        submit={(values) => changePassword(values.newPassword ?? '', hasPassword ? values.currentPassword : undefined)}
        successMessage={hasPassword ? 'Password changed.' : 'Password set.'}
      />
      <DeleteAccountRow user={user} hasPassword={hasPassword} />
    </>
  );
};

export default AccountSettings;
