import { api } from './api'

export type AuthResponse = { token: string; email: string }

export const authService = {
  register: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { email, password }),
  logout: () =>
    api.post<void>('/api/auth/logout', {}),
}
