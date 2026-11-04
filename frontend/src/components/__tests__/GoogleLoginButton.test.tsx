import { render, screen, waitFor } from '@testing-library/react';
import GoogleLoginButton from '../GoogleLoginButton';
import { getEnv } from '../../utils/Env';
import { loadGoogleIdentity, type GoogleCredentialResponse } from '../../auth/googleIdentity';

jest.mock('../../utils/Env', () => ({ getEnv: jest.fn() }));
jest.mock('../../auth/googleIdentity', () => ({ loadGoogleIdentity: jest.fn() }));

const mockedGetEnv = getEnv as jest.Mock;
const mockedLoad = loadGoogleIdentity as jest.Mock;

const initialize = jest.fn();
const renderButton = jest.fn();
const google = { accounts: { id: { initialize, renderButton } } };

const renderButtonWith = (clientId: string) => {
  mockedGetEnv.mockReturnValue({ API_BASE_URL: '/api', MEDIA_BASE_URL: '/media', GOOGLE_CLIENT_ID: clientId });
  const onCredential = jest.fn();
  const onError = jest.fn();
  const view = render(<GoogleLoginButton onCredential={onCredential} onError={onError} />);
  return { onCredential, onError, ...view };
};

describe('GoogleLoginButton', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedLoad.mockResolvedValue(google);
  });

  it('shows nothing when Google login is not configured', () => {
    const { container } = renderButtonWith('');

    expect(container).toBeEmptyDOMElement();
    expect(mockedLoad).not.toHaveBeenCalled();
  });

  it("renders Google's button with our client id", async () => {
    renderButtonWith('client-id.apps.googleusercontent.com');

    expect(screen.getByText('or')).toBeInTheDocument();
    await waitFor(() => expect(renderButton).toHaveBeenCalled());
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'client-id.apps.googleusercontent.com' })
    );
  });

  it('passes the credential chosen in Google to onCredential', async () => {
    const { onCredential } = renderButtonWith('client-id');
    await waitFor(() => expect(initialize).toHaveBeenCalled());

    const { callback } = initialize.mock.calls[0][0] as { callback: (r: GoogleCredentialResponse) => void };
    callback({ credential: 'google-id-token' });

    expect(onCredential).toHaveBeenCalledWith('google-id-token');
  });

  it('reports an error when Google cannot be loaded', async () => {
    mockedLoad.mockRejectedValue(new Error('offline'));

    const { onError } = renderButtonWith('client-id');

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('Google login is not available right now. Please try again later.')
    );
  });

  it('does nothing if it is removed before Google loads', async () => {
    const { unmount } = renderButtonWith('client-id');
    unmount();

    await Promise.resolve();
    expect(initialize).not.toHaveBeenCalled();
  });
});
