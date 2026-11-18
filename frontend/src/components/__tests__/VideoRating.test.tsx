import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import VideoRating from '../VideoRating';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { fetchRating, rateVideo } from '../../ratings/ratingsApi';

jest.mock('../../ratings/ratingsApi', () => ({
  ...jest.requireActual('../../ratings/ratingsApi'),
  fetchRating: jest.fn(),
  rateVideo: jest.fn(),
}));
const mockedFetchRating = fetchRating as jest.MockedFunction<typeof fetchRating>;
const mockedRateVideo = rateVideo as jest.MockedFunction<typeof rateVideo>;

const alice = { id: 1, username: 'alice', email: 'alice@example.com' };

const apiError = (status: number, data: object = {}) =>
  new AxiosError('error', String(status), undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

const LoginPage = () => <p>Login page from {(useLocation().state as { from: string }).from}</p>;

const renderRating = (user: AuthContextValue['user'] = alice) =>
  render(
    <AuthContext.Provider
      value={{
        user,
        login: jest.fn(),
        register: jest.fn(),
        loginWithGoogle: jest.fn(),
        logout: jest.fn(),
        updateSession: jest.fn(),
      }}
    >
      <MemoryRouter initialEntries={['/videos/5']}>
        <Routes>
          <Route path="/videos/:id" element={<VideoRating videoId={5} />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

const star = (stars: number) => screen.getByRole('radio', { name: stars === 1 ? '1 star' : `${stars} stars` });

describe('VideoRating', () => {
  beforeEach(() => {
    mockedFetchRating.mockReset();
    mockedRateVideo.mockReset();
  });

  it('shows a loading message while the rating is requested', () => {
    mockedFetchRating.mockReturnValueOnce(new Promise(() => {}));

    renderRating();

    expect(screen.getByRole('status')).toHaveTextContent('Loading rating...');
  });

  it('shows the average with stars and the number of ratings', async () => {
    mockedFetchRating.mockResolvedValueOnce({ average: 4.5, count: 25, myScore: null });

    renderRating();

    expect(await screen.findByText('4.5/5')).toBeInTheDocument();
    expect(screen.getByText('(25 ratings)')).toBeInTheDocument();
    expect(mockedFetchRating).toHaveBeenCalledWith(5);
  });

  it('says there are no ratings yet instead of showing a fake average', async () => {
    mockedFetchRating.mockResolvedValueOnce({ average: null, count: 0, myScore: null });

    renderRating();

    expect(await screen.findByText('No ratings yet')).toBeInTheDocument();
    expect(screen.queryByText(/\/5/)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rates the video and shows the new average', async () => {
    const user = userEvent.setup();
    mockedFetchRating.mockResolvedValueOnce({ average: null, count: 0, myScore: null });
    mockedRateVideo.mockResolvedValueOnce({ average: 4, count: 1, myScore: 4 });
    renderRating();

    await user.click(await screen.findByRole('radio', { name: '4 stars' }));

    expect(mockedRateVideo).toHaveBeenCalledWith(5, 4);
    expect(await screen.findByRole('status')).toHaveTextContent('Thanks! Your rating was saved.');
    expect(screen.getByText('4.0/5')).toBeInTheDocument();
    expect(screen.getByText('(1 rating)')).toBeInTheDocument();
    expect(star(4)).toHaveAttribute('aria-checked', 'true');
  });

  it('shows the score I gave and lets me change it', async () => {
    const user = userEvent.setup();
    mockedFetchRating.mockResolvedValueOnce({ average: 3, count: 2, myScore: 2 });
    mockedRateVideo.mockResolvedValueOnce({ average: 4.5, count: 2, myScore: 5 });
    renderRating();

    expect(await screen.findByText('Your rating')).toBeInTheDocument();
    expect(star(2)).toHaveAttribute('aria-checked', 'true');

    await user.click(star(5));

    expect(mockedRateVideo).toHaveBeenCalledWith(5, 5);
    expect(await screen.findByRole('status')).toHaveTextContent('Your rating was updated.');
    expect(screen.getByText('4.5/5')).toBeInTheDocument();
    // Still 2 ratings: the previous one was changed, not added
    expect(screen.getByText('(2 ratings)')).toBeInTheDocument();
    expect(star(5)).toHaveAttribute('aria-checked', 'true');
    expect(star(2)).toHaveAttribute('aria-checked', 'false');
  });

  it('does not send the same score again', async () => {
    const user = userEvent.setup();
    mockedFetchRating.mockResolvedValueOnce({ average: 3, count: 1, myScore: 3 });
    renderRating();

    await user.click(await screen.findByRole('radio', { name: '3 stars' }));

    expect(mockedRateVideo).not.toHaveBeenCalled();
  });

  it('lights up the stars under the mouse', async () => {
    const user = userEvent.setup();
    mockedFetchRating.mockResolvedValueOnce({ average: null, count: 0, myScore: null });
    renderRating();

    await user.hover(await screen.findByRole('radio', { name: '3 stars' }));

    expect(star(1)).toHaveClass('is-on');
    expect(star(3)).toHaveClass('is-on');
    expect(star(4)).not.toHaveClass('is-on');

    await user.unhover(screen.getByRole('radiogroup', { name: 'Your rating' }));
    expect(star(1)).not.toHaveClass('is-on');
  });

  it('shows an understandable message when the rating cannot be saved', async () => {
    const user = userEvent.setup();
    mockedFetchRating.mockResolvedValueOnce({ average: null, count: 0, myScore: null });
    mockedRateVideo.mockRejectedValueOnce(apiError(500, { message: 'Unexpected error. Please try again.' }));
    renderRating();

    await user.click(await screen.findByRole('radio', { name: '4 stars' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save your rating.');
    expect(screen.getByText('No ratings yet')).toBeInTheDocument();
    // Enabled again so the user can retry
    expect(star(4)).toBeEnabled();
  });

  it('asks to log in again when the session has expired', async () => {
    const user = userEvent.setup();
    mockedFetchRating.mockResolvedValueOnce({ average: null, count: 0, myScore: null });
    mockedRateVideo.mockRejectedValueOnce(apiError(401));
    renderRating();

    await user.click(await screen.findByRole('radio', { name: '1 star' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your session has expired.');
  });

  it('invites anonymous visitors to log in instead of showing the picker', async () => {
    const user = userEvent.setup();
    mockedFetchRating.mockResolvedValueOnce({ average: 4.5, count: 2, myScore: null });
    renderRating(null);

    expect(await screen.findByText('4.5/5')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Log in to rate this video' }));
    expect(screen.getByText('Login page from /videos/5')).toBeInTheDocument();
  });

  it('shows an error that can be retried when the rating cannot be loaded', async () => {
    const user = userEvent.setup();
    mockedFetchRating
      .mockRejectedValueOnce(apiError(500))
      .mockResolvedValueOnce({ average: 2, count: 1, myScore: null });
    renderRating();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not load the rating.');
    await user.click(within(alert).getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('2.0/5')).toBeInTheDocument();
  });
});
