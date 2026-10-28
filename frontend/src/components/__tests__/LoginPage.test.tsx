import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '../LoginPage';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';

const renderLoginPage = (overrides: Partial<AuthContextValue> = {}) => {
  const auth: AuthContextValue = {
    user: null,
    login: jest.fn().mockResolvedValue(undefined),
    register: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn(),
    ...overrides,
  };
  const onSuccess = jest.fn();
  render(
    <AuthContext.Provider value={auth}>
      <LoginPage onSuccess={onSuccess} />
    </AuthContext.Provider>
  );
  return { auth, onSuccess };
};

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

describe('LoginPage', () => {
  it('shows the login form by default', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  it('requires username and password to log in', () => {
    const { auth } = renderLoginPage();

    submit('Login');

    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('logs in and calls onSuccess', async () => {
    const { auth, onSuccess } = renderLoginPage();

    type('Username', ' alice ');
    type('Password', 'password123');
    submit('Login');

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(auth.login).toHaveBeenCalledWith('alice', 'password123');
  });

  it('shows the error returned by the backend on wrong credentials', async () => {
    const { onSuccess } = renderLoginPage({
      login: jest.fn().mockRejectedValue({ response: { data: { message: 'Invalid username or password' } } }),
    });

    type('Username', 'alice');
    type('Password', 'wrong');
    submit('Login');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows and hides the password', () => {
    renderLoginPage();
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('switches to the register form and back', () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('validates the register form before sending it', () => {
    const { auth } = renderLoginPage();
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    type('Username', 'al');
    type('Email', 'not-an-email');
    type('Password', 'short');
    fireEvent.submit(screen.getByLabelText('Username').closest('form')!);

    expect(screen.getByText('Username must be between 3 and 30 characters')).toBeInTheDocument();
    expect(screen.getByText('Email is not valid')).toBeInTheDocument();
    expect(screen.getByText('Password must be between 8 and 72 characters')).toBeInTheDocument();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('rejects usernames with invalid characters and a missing email', () => {
    renderLoginPage();
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    type('Username', 'alice smith');
    type('Password', 'password123');
    fireEvent.submit(screen.getByLabelText('Username').closest('form')!);

    expect(screen.getByText("Username can only contain letters, numbers, '.', '_' and '-'")).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('registers a new user and calls onSuccess', async () => {
    const { auth, onSuccess } = renderLoginPage();
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    type('Username', 'alice');
    type('Email', 'alice@mail.com');
    type('Password', 'password123');
    fireEvent.submit(screen.getByLabelText('Username').closest('form')!);

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(auth.register).toHaveBeenCalledWith('alice', 'alice@mail.com', 'password123');
  });

  it('shows the backend error next to the field when the email is already registered', async () => {
    renderLoginPage({
      register: jest.fn().mockRejectedValue({
        response: {
          data: { message: 'Email is already registered', fieldErrors: { email: 'Email is already registered' } },
        },
      }),
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    type('Username', 'alice');
    type('Email', 'alice@mail.com');
    type('Password', 'password123');
    fireEvent.submit(screen.getByLabelText('Username').closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is already registered');
    expect(screen.getByLabelText('Email')).toHaveClass('is-invalid');
  });
});
