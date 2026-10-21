import axios, { AxiosError } from 'axios';
import { getEnv } from '../utils/Env';

export type User = {
  id: number;
  username: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type ApiError = {
  message: string;
  // Form field name -> error message, as returned by the backend
  fieldErrors: Record<string, string>;
};

const authUrl = () => `${getEnv().API_BASE_URL}/auth`;

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const response = await axios.post<AuthResponse>(`${authUrl()}/register`, { username, email, password });
  return response.data;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const response = await axios.post<AuthResponse>(`${authUrl()}/login`, { username, password });
  return response.data;
}

export async function fetchCurrentUser(token: string): Promise<User> {
  const response = await axios.get<User>(`${authUrl()}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export function isUnauthorized(error: unknown): boolean {
  return (error as AxiosError).response?.status === 401;
}

/**
 * Converts any error thrown by the calls above into a message (and field errors) ready to show in a form.
 */
export function toApiError(error: unknown): ApiError {
  const response = (error as AxiosError<Partial<ApiError>>).response;
  if (!response) {
    return { message: 'Could not connect to the server. Please try again later.', fieldErrors: {} };
  }
  return {
    message: response.data?.message ?? 'Unexpected error. Please try again.',
    fieldErrors: response.data?.fieldErrors ?? {},
  };
}
