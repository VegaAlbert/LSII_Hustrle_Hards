import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AxiosError, type AxiosResponse } from 'axios';
import CommentForm from '../CommentForm';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { postComment, postReply, type VideoComment } from '../../videos/videosApi';
import { I18nProvider } from '../../i18n/I18nProvider';

jest.mock('../../videos/videosApi', () => ({
  ...jest.requireActual('../../videos/videosApi'),
  postComment: jest.fn(),
  postReply: jest.fn(),
}));
const mockedPostComment = postComment as jest.MockedFunction<typeof postComment>;
const mockedPostReply = postReply as jest.MockedFunction<typeof postReply>;

const alice = { id: 1, username: 'alice', email: 'alice@example.com' };

const saved: VideoComment = {
  id: 7,
  author: 'alice',
  text: 'Great song!',
  likeCount: 0,
  publishedAt: '2026-11-12T10:00:00Z',
  likedByMe: false,
  replies: [],
};

// Shows where the login link sends the user back to
const LoginStub = () => {
  const from = (useLocation().state as { from?: string } | null)?.from;
  return <p>Login page, back to {from}</p>;
};

const httpError = (status: number, data: object) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data,
  } as AxiosResponse);

const renderForm = (user: AuthContextValue['user'], onCommentAdded = jest.fn()) => {
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
      <MemoryRouter initialEntries={['/videos/5?t=30']}>
        <Routes>
          <Route path="/videos/:id" element={<CommentForm videoId={5} onCommentAdded={onCommentAdded} />} />
          <Route path="/login" element={<LoginStub />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
    { wrapper: I18nProvider }
  );
  return onCommentAdded;
};

describe('CommentForm', () => {
  beforeEach(() => {
    mockedPostComment.mockReset();
    mockedPostReply.mockReset();
  });

  it('asks anonymous visitors to log in and brings them back to the video', async () => {
    const user = userEvent.setup();
    renderForm(null);

    expect(screen.queryByLabelText('Add a comment')).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Log in to comment' }));

    expect(screen.getByText('Login page, back to /videos/5?t=30')).toBeInTheDocument();
  });

  it('does not let a blank comment be sent', async () => {
    const user = userEvent.setup();
    renderForm(alice);

    const button = screen.getByRole('button', { name: 'Comment' });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText('Add a comment'), '   ');
    expect(button).toBeDisabled();
  });

  it('sends the trimmed comment, passes the saved one on and clears the box', async () => {
    const user = userEvent.setup();
    mockedPostComment.mockResolvedValueOnce(saved);
    const onCommentAdded = renderForm(alice);

    await user.type(screen.getByLabelText('Add a comment'), '  Great song!  ');
    await user.click(screen.getByRole('button', { name: 'Comment' }));

    expect(mockedPostComment).toHaveBeenCalledWith(5, 'Great song!');
    expect(onCommentAdded).toHaveBeenCalledWith(saved);
    expect(screen.getByLabelText('Add a comment')).toHaveValue('');
  });

  it('shows the error of the backend and keeps the text', async () => {
    const user = userEvent.setup();
    mockedPostComment.mockRejectedValueOnce(
      httpError(400, { message: 'Invalid data', fieldErrors: { text: 'Comment must be at most 1000 characters' } })
    );
    const onCommentAdded = renderForm(alice);

    await user.type(screen.getByLabelText('Add a comment'), 'Too long');
    await user.click(screen.getByRole('button', { name: 'Comment' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Comment must be at most 1000 characters');
    expect(screen.getByLabelText('Add a comment')).toHaveValue('Too long');
    expect(onCommentAdded).not.toHaveBeenCalled();
  });

  it('asks to log in again when the session has expired', async () => {
    const user = userEvent.setup();
    mockedPostComment.mockRejectedValueOnce(httpError(401, {}));
    renderForm(alice);

    await user.type(screen.getByLabelText('Add a comment'), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Comment' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your session has expired.');
    await user.click(screen.getByRole('link', { name: 'Log in again' }));
    expect(screen.getByText('Login page, back to /videos/5?t=30')).toBeInTheDocument();
  });

  it('clears the text with Cancel', async () => {
    const user = userEvent.setup();
    renderForm(alice);

    await user.type(screen.getByLabelText('Add a comment'), 'Never mind');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByLabelText('Add a comment')).toHaveValue('');
    expect(mockedPostComment).not.toHaveBeenCalled();
  });

  describe('as a reply form (US-10)', () => {
    const renderReplyForm = (onCancel = jest.fn()) => {
      const onCommentAdded = jest.fn();
      render(
        <AuthContext.Provider
          value={{
            user: alice,
            login: jest.fn(),
            register: jest.fn(),
            loginWithGoogle: jest.fn(),
            logout: jest.fn(),
            updateSession: jest.fn(),
          }}
        >
          <MemoryRouter>
            <CommentForm videoId={5} parentId={7} onCommentAdded={onCommentAdded} onCancel={onCancel} />
          </MemoryRouter>
        </AuthContext.Provider>
      );
      return { onCommentAdded, onCancel };
    };

    it('posts the trimmed reply to the comment', async () => {
      const user = userEvent.setup();
      mockedPostReply.mockResolvedValueOnce(saved);
      const { onCommentAdded } = renderReplyForm();

      await user.type(screen.getByLabelText('Add a reply'), '  Agree  ');
      await user.click(screen.getByRole('button', { name: 'Reply' }));

      expect(mockedPostReply).toHaveBeenCalledWith(5, 7, 'Agree');
      expect(mockedPostComment).not.toHaveBeenCalled();
      expect(onCommentAdded).toHaveBeenCalledWith(saved);
    });

    it('can be closed with Cancel even when empty', async () => {
      const user = userEvent.setup();
      const { onCancel } = renderReplyForm();

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalled();
    });

    it('asks to log in again to reply when the session has expired', async () => {
      const user = userEvent.setup();
      mockedPostReply.mockRejectedValueOnce(httpError(401, {}));
      renderReplyForm();

      await user.type(screen.getByLabelText('Add a reply'), 'Hello');
      await user.click(screen.getByRole('button', { name: 'Reply' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Log in again to reply.');
    });
  });

  describe('in another language', () => {
    afterEach(() => localStorage.clear());

    it('asks anonymous visitors to log in in Spanish', () => {
      localStorage.setItem('protube.language', 'es');
      renderForm(null);

      expect(screen.getByText('Inicia sesión para comentar este vídeo.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Inicia sesión para comentar' })).toBeInTheDocument();
    });

    it('labels the form and its buttons in Catalan', () => {
      localStorage.setItem('protube.language', 'ca');
      renderForm(alice);

      expect(screen.getByLabelText('Afegeix un comentari')).toHaveAttribute('placeholder', 'Afegeix un comentari...');
      expect(screen.getByRole('button', { name: 'Comenta' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel·la' })).toBeInTheDocument();
    });
  });
});
