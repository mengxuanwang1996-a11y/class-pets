import { apiRequest, setTokens, clearTokens } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(response.accessToken, response.refreshToken);
  return response;
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  setTokens(response.accessToken, response.refreshToken);
  return response;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    clearTokens();
  }
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me');
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}
