import axios from 'axios';
import { changeEmail, changePassword, changeUsername, deleteAccount } from '../accountApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const session = { token: 'new-token', user: { id: 1, username: 'alicia', email: 'alice@mail.com' } };

describe('accountApi', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedAxios.put.mockResolvedValue({ data: session });
  });

  it('changes the username and returns the new session', async () => {
    await expect(changeUsername('alicia')).resolves.toEqual(session);
    expect(mockedAxios.put).toHaveBeenCalledWith('other/account/username', { username: 'alicia' });
  });

  it('changes the email', async () => {
    await expect(changeEmail('alice@new.com')).resolves.toEqual(session);
    expect(mockedAxios.put).toHaveBeenCalledWith('other/account/email', { email: 'alice@new.com' });
  });

  it('changes the password with the current one', async () => {
    await changePassword('new-password', 'old-password');
    expect(mockedAxios.put).toHaveBeenCalledWith('other/account/password', {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
  });

  it('sets the first password of a Google account without a current one', async () => {
    await changePassword('new-password');
    expect(mockedAxios.put).toHaveBeenCalledWith('other/account/password', {
      currentPassword: undefined,
      newPassword: 'new-password',
    });
  });

  it('deletes the account with the confirmation in the body', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: undefined });

    await deleteAccount({ password: 'password123' });
    expect(mockedAxios.delete).toHaveBeenCalledWith('other/account', { data: { password: 'password123' } });
  });
});
