import axios from 'axios';
import type { AuthResponse } from '../auth/authApi';
import { getEnv } from '../utils/Env';

// Account section of the settings. Every change answers with a new session (the token holds the username)
const accountUrl = () => `${getEnv().API_BASE_URL}/account`;

export async function changeUsername(username: string): Promise<AuthResponse> {
  const response = await axios.put<AuthResponse>(`${accountUrl()}/username`, { username });
  return response.data;
}

export async function changeEmail(email: string): Promise<AuthResponse> {
  const response = await axios.put<AuthResponse>(`${accountUrl()}/email`, { email });
  return response.data;
}

/**
 * currentPassword is left out by accounts created with Google that set their first password.
 */
export async function changePassword(newPassword: string, currentPassword?: string): Promise<AuthResponse> {
  const response = await axios.put<AuthResponse>(`${accountUrl()}/password`, { currentPassword, newPassword });
  return response.data;
}

/**
 * Deletes the account and everything that belongs to it. Accounts with a password confirm with it; accounts created
 * with Google that never set one type their username in confirmation.
 */
export async function deleteAccount(confirm: { password?: string; confirmation?: string }): Promise<void> {
  await axios.delete(accountUrl(), { data: confirm });
}
