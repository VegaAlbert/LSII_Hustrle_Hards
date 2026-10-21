import axios from 'axios';
import { fetchCurrentUser, isUnauthorized, login, register, toApiError } from '../authApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const authResponse = { token: 'token', user: { id: 1, username: 'alice', email: 'alice@mail.com' } };

describe('authApi', () => {
  beforeEach(() => jest.resetAllMocks());

  it('registers a user', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: authResponse });

    await expect(register('alice', 'alice@mail.com', 'password123')).resolves.toEqual(authResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith('other/auth/register', {
      username: 'alice',
      email: 'alice@mail.com',
      password: 'password123',
    });
  });

  it('logs a user in', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: authResponse });

    await expect(login('alice', 'password123')).resolves.toEqual(authResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith('other/auth/login', { username: 'alice', password: 'password123' });
  });

  it('fetches the current user with the token', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: authResponse.user });

    await expect(fetchCurrentUser('token')).resolves.toEqual(authResponse.user);
    expect(mockedAxios.get).toHaveBeenCalledWith('other/auth/me', { headers: { Authorization: 'Bearer token' } });
  });

  it('detects unauthorized errors', () => {
    expect(isUnauthorized({ response: { status: 401 } })).toBe(true);
    expect(isUnauthorized({ response: { status: 500 } })).toBe(false);
    expect(isUnauthorized(new Error('network'))).toBe(false);
  });

  describe('toApiError', () => {
    it('uses the message and field errors sent by the backend', () => {
      const error = { response: { data: { message: 'Invalid data', fieldErrors: { email: 'Email is not valid' } } } };

      expect(toApiError(error)).toEqual({ message: 'Invalid data', fieldErrors: { email: 'Email is not valid' } });
    });

    it('falls back to a generic message when the backend sends no body', () => {
      expect(toApiError({ response: { data: undefined } })).toEqual({
        message: 'Unexpected error. Please try again.',
        fieldErrors: {},
      });
    });

    it('explains when the server cannot be reached', () => {
      expect(toApiError(new Error('Network Error')).message).toMatch(/could not connect/i);
    });
  });
});
