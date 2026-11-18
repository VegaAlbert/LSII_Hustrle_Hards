import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosError, type AxiosResponse } from 'axios';
import AccountSettings from '../AccountSettings';
import { changeEmail, changePassword, changeUsername, deleteAccount } from '../../account/accountApi';
import type { User } from '../../auth/authApi';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';

jest.mock('../../account/accountApi', () => ({
  changeUsername: jest.fn(),
  changeEmail: jest.fn(),
  changePassword: jest.fn(),
  deleteAccount: jest.fn(),
}));
const mockedChangeUsername = changeUsername as jest.MockedFunction<typeof changeUsername>;
const mockedChangeEmail = changeEmail as jest.MockedFunction<typeof changeEmail>;
const mockedChangePassword = changePassword as jest.MockedFunction<typeof changePassword>;
const mockedDeleteAccount = deleteAccount as jest.MockedFunction<typeof deleteAccount>;

const alice: User = { id: 1, username: 'alice', email: 'alice@mail.com', hasPassword: true, googleLinked: false };
const carol: User = { id: 2, username: 'carol', email: 'carol@gmail.com', hasPassword: false, googleLinked: true };

// An error answered by the backend, as axios throws it
const apiError = (status: number, data: object) =>
  new AxiosError('Request failed', String(status), undefined, undefined, { status, data } as AxiosResponse);

let updateSession: jest.Mock;
let logout: jest.Mock;

const renderAccount = (user: User) => {
  updateSession = jest.fn();
  logout = jest.fn();
  const auth: AuthContextValue = {
    user,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout,
    updateSession,
  };
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<AccountSettings user={user} />} />
          <Route path="/" element={<p>Home page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('AccountSettings', () => {
  beforeEach(() => jest.resetAllMocks());

  it('shows the current username and email', () => {
    renderAccount(alice);

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('alice@mail.com')).toBeInTheDocument();
  });

  it('changes the username and keeps the new session', async () => {
    const user = userEvent.setup();
    const session = { token: 'new-token', user: { ...alice, username: 'alicia' } };
    mockedChangeUsername.mockResolvedValueOnce(session);
    renderAccount(alice);

    await user.click(screen.getByRole('button', { name: 'Change username' }));
    const input = screen.getByLabelText('New username');
    expect(input).toHaveValue('alice');
    await user.clear(input);
    await user.type(input, 'alicia');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockedChangeUsername).toHaveBeenCalledWith('alicia');
    expect(updateSession).toHaveBeenCalledWith(session);
    expect(await screen.findByRole('status')).toHaveTextContent('Username updated.');
    expect(screen.queryByLabelText('New username')).not.toBeInTheDocument();
  });

  it('shows the error of a taken username next to the field', async () => {
    const user = userEvent.setup();
    mockedChangeUsername.mockRejectedValueOnce(
      apiError(409, { message: 'Username is already taken', fieldErrors: { username: 'Username is already taken' } })
    );
    renderAccount(alice);

    await user.click(screen.getByRole('button', { name: 'Change username' }));
    await user.clear(screen.getByLabelText('New username'));
    await user.type(screen.getByLabelText('New username'), 'bob');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Username is already taken')).toBeInTheDocument();
    expect(screen.getByLabelText('New username')).toHaveAttribute('aria-invalid', 'true');
    expect(updateSession).not.toHaveBeenCalled();
  });

  it('changes the email', async () => {
    const user = userEvent.setup();
    const session = { token: 'token', user: { ...alice, email: 'alice@new.com' } };
    mockedChangeEmail.mockResolvedValueOnce(session);
    renderAccount(alice);

    await user.click(screen.getByRole('button', { name: 'Change email' }));
    await user.clear(screen.getByLabelText('New email'));
    await user.type(screen.getByLabelText('New email'), 'alice@new.com');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockedChangeEmail).toHaveBeenCalledWith('alice@new.com');
    expect(await screen.findByRole('status')).toHaveTextContent('Email updated.');
  });

  it('changes the password with the current one', async () => {
    const user = userEvent.setup();
    mockedChangePassword.mockResolvedValueOnce({ token: 'token', user: alice });
    renderAccount(alice);

    await user.click(screen.getByRole('button', { name: 'Change password' }));
    await user.type(screen.getByLabelText('Current password'), 'old-password');
    await user.type(screen.getByLabelText('New password'), 'new-password');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockedChangePassword).toHaveBeenCalledWith('new-password', 'old-password');
    expect(await screen.findByRole('status')).toHaveTextContent('Password changed.');
  });

  it('shows a wrong current password next to its field', async () => {
    const user = userEvent.setup();
    mockedChangePassword.mockRejectedValueOnce(
      apiError(400, {
        message: 'Current password is incorrect',
        fieldErrors: { currentPassword: 'Current password is incorrect' },
      })
    );
    renderAccount(alice);

    await user.click(screen.getByRole('button', { name: 'Change password' }));
    await user.type(screen.getByLabelText('Current password'), 'wrong');
    await user.type(screen.getByLabelText('New password'), 'new-password');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
    expect(screen.getByLabelText('Current password')).toHaveAttribute('aria-invalid', 'true');
  });

  it('lets a Google account set its first password without a current one', async () => {
    const user = userEvent.setup();
    mockedChangePassword.mockResolvedValueOnce({ token: 'token', user: { ...carol, hasPassword: true } });
    renderAccount(carol);
    expect(screen.getByText(/Your account uses Google sign-in/)).toBeInTheDocument();
    expect(screen.getByText('carol@gmail.com · Google sign-in enabled')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Set password' }));
    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('New password'), 'carol-password');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockedChangePassword).toHaveBeenCalledWith('carol-password', undefined);
    expect(await screen.findByRole('status')).toHaveTextContent('Password set.');
  });

  it('shows errors without a field above the form', async () => {
    const user = userEvent.setup();
    mockedChangeEmail.mockRejectedValueOnce(new Error('Network Error'));
    renderAccount(alice);

    await user.click(screen.getByRole('button', { name: 'Change email' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not connect to the server');
    expect(screen.getByLabelText('New email')).toBeInTheDocument();
  });

  it('closes the form without saving on cancel', async () => {
    const user = userEvent.setup();
    renderAccount(alice);

    await user.click(screen.getByRole('button', { name: 'Change email' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('New email')).not.toBeInTheDocument();
    expect(mockedChangeEmail).not.toHaveBeenCalled();
  });

  it('deletes the account after confirming with the password, logs out and goes home', async () => {
    const user = userEvent.setup();
    mockedDeleteAccount.mockResolvedValueOnce(undefined);
    renderAccount(alice);

    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    expect(screen.getByText(/It cannot be undone/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete permanently' })).toBeDisabled();
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));

    expect(mockedDeleteAccount).toHaveBeenCalledWith({ password: 'password123' });
    expect(logout).toHaveBeenCalled();
    expect(await screen.findByText('Home page')).toBeInTheDocument();
  });

  it('keeps the account when the password is wrong', async () => {
    const user = userEvent.setup();
    mockedDeleteAccount.mockRejectedValueOnce(
      apiError(400, { message: 'Password is incorrect', fieldErrors: { password: 'Password is incorrect' } })
    );
    renderAccount(alice);

    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));

    expect(await screen.findByText('Password is incorrect')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(logout).not.toHaveBeenCalled();
    expect(screen.queryByText('Home page')).not.toBeInTheDocument();
  });

  it('asks a Google account without password to type its username', async () => {
    const user = userEvent.setup();
    mockedDeleteAccount.mockResolvedValueOnce(undefined);
    renderAccount(carol);

    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    await user.type(screen.getByLabelText('Type carol to confirm'), 'carol');
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));

    expect(mockedDeleteAccount).toHaveBeenCalledWith({ confirmation: 'carol' });
    expect(logout).toHaveBeenCalled();
  });

  it('shows errors of the server and closes the form on cancel', async () => {
    const user = userEvent.setup();
    mockedDeleteAccount.mockRejectedValueOnce(new Error('Network Error'));
    renderAccount(alice);

    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));
    expect(await screen.findByText(/Could not connect to the server/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });
});
