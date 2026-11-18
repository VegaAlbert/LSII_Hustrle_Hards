import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AxiosError, type AxiosResponse } from 'axios';
import FavouriteButton from '../FavouriteButton';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { fetchFavouriteState, setFavourite } from '../../favourites/favouritesApi';
import { I18nProvider } from '../../i18n/I18nProvider';

jest.mock('../../favourites/favouritesApi');
const mockedFetchState = fetchFavouriteState as jest.MockedFunction<typeof fetchFavouriteState>;
const mockedSetFavourite = setFavourite as jest.MockedFunction<typeof setFavourite>;

const alice = { id: 1, username: 'alice', email: 'alice@example.com' };

// Shows where the login redirect sends the user back to
const LoginStub = () => {
  const from = (useLocation().state as { from?: string } | null)?.from;
  return <p>Login page, back to {from}</p>;
};

const httpError = (status: number) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: {},
  } as AxiosResponse);

const renderButton = (user: AuthContextValue['user']) =>
  render(
    <I18nProvider>
      <AuthContext.Provider
        value={{ user, login: jest.fn(), register: jest.fn(), loginWithGoogle: jest.fn(), logout: jest.fn() }}
      >
        <MemoryRouter initialEntries={['/videos/5?t=30']}>
          <Routes>
            <Route path="/videos/:id" element={<FavouriteButton videoId={5} />} />
            <Route path="/login" element={<LoginStub />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </I18nProvider>
  );

// The button once the saved state has been read (it is disabled until then)
const readyButton = async (name: string) => {
  const button = await screen.findByRole('button', { name });
  await waitFor(() => expect(button).toBeEnabled());
  return button;
};

describe('FavouriteButton', () => {
  beforeEach(() => {
    mockedFetchState.mockReset();
    mockedSetFavourite.mockReset();
  });

  it('shows a video that is not saved yet', async () => {
    mockedFetchState.mockResolvedValueOnce({ videoId: 5, favourite: false });
    renderButton(alice);

    const button = screen.getByRole('button', { name: 'Save to favourites' });
    // Disabled until the saved state is known
    expect(button).toBeDisabled();
    await waitFor(() => expect(button).toBeEnabled());
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(mockedFetchState).toHaveBeenCalledWith(5);
  });

  it('shows a saved video as pressed', async () => {
    mockedFetchState.mockResolvedValueOnce({ videoId: 5, favourite: true });
    renderButton(alice);

    const button = await screen.findByRole('button', { name: 'Saved' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('saves the video', async () => {
    const user = userEvent.setup();
    mockedFetchState.mockResolvedValueOnce({ videoId: 5, favourite: false });
    mockedSetFavourite.mockResolvedValueOnce({ videoId: 5, favourite: true });
    renderButton(alice);

    await user.click(await readyButton('Save to favourites'));

    expect(mockedSetFavourite).toHaveBeenCalledWith(5, true);
    expect(await screen.findByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('removes a saved video', async () => {
    const user = userEvent.setup();
    mockedFetchState.mockResolvedValueOnce({ videoId: 5, favourite: true });
    mockedSetFavourite.mockResolvedValueOnce({ videoId: 5, favourite: false });
    renderButton(alice);

    await user.click(await readyButton('Saved'));

    expect(mockedSetFavourite).toHaveBeenCalledWith(5, false);
    expect(await screen.findByRole('button', { name: 'Save to favourites' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('starts as not saved when the state cannot be read', async () => {
    mockedFetchState.mockRejectedValueOnce(httpError(500));
    renderButton(alice);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save to favourites' })).toBeEnabled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error when saving fails', async () => {
    const user = userEvent.setup();
    mockedFetchState.mockResolvedValueOnce({ videoId: 5, favourite: false });
    mockedSetFavourite.mockRejectedValueOnce(httpError(500));
    renderButton(alice);

    await user.click(await readyButton('Save to favourites'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not update your favourites.');
    expect(screen.getByRole('button', { name: 'Save to favourites' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('asks to log in again when the session expired', async () => {
    const user = userEvent.setup();
    mockedFetchState.mockResolvedValueOnce({ videoId: 5, favourite: false });
    mockedSetFavourite.mockRejectedValueOnce(httpError(401));
    renderButton(alice);

    await user.click(await readyButton('Save to favourites'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your session has expired. Log in again to save favourites.'
    );
  });

  it('sends anonymous visitors to log in and back to the video', async () => {
    const user = userEvent.setup();
    renderButton(null);

    await user.click(screen.getByRole('button', { name: 'Save to favourites' }));

    expect(screen.getByText('Login page, back to /videos/5?t=30')).toBeInTheDocument();
    expect(mockedFetchState).not.toHaveBeenCalled();
    expect(mockedSetFavourite).not.toHaveBeenCalled();
  });

  it('is named in Catalan', async () => {
    localStorage.setItem('protube.language', 'ca');
    mockedFetchState.mockResolvedValueOnce({ videoId: 5, favourite: true });

    renderButton(alice);

    expect(await readyButton('Desat')).toHaveAttribute('aria-pressed', 'true');
    localStorage.clear();
  });
});
