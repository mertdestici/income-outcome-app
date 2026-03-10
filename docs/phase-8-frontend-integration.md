# Phase 8: Frontend Integration

## Status: Complete ✓

## Overview
Wire the React frontend to the Spring Boot backend. Replace all localStorage income/expense operations with authenticated API calls. Add login/register pages. Handle token lifecycle (storage, injection, expiry/401 redirect).

---

## Current State

The frontend is fully localStorage-based:
- `App.tsx` reads/writes `incomes_v1` and `expenses_v1` directly
- No concept of users or sessions
- `services/income.ts` does not exist
- No HTTP client is configured

---

## Files to Create

### Services

#### `services/api.ts` — Base HTTP client
```ts
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    window.location.hash = 'login'   // triggers re-render to login route
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get:    <T>(path: string)                        => request<T>(path),
  post:   <T>(path: string, body: unknown)         => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)         => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)                        => request<T>(path, { method: 'DELETE' }),
}
```

#### `services/auth.ts`
```ts
import { api } from './api'

export type AuthResponse = { token: string; email: string }

export const authService = {
  register: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { email, password }),
  logout: () => api.post<void>('/api/auth/logout', {}),
}
```

#### `services/income.ts`
```ts
import { api } from './api'
import type { Income } from '../types/income'

export type IncomePage = { content: Income[]; totalElements: number; totalPages: number }

export const incomeService = {
  list:   (params?: string) => api.get<IncomePage>(`/api/incomes${params ? '?' + params : ''}`),
  create: (body: Omit<Income, 'id' | 'createdAt'>) => api.post<Income>('/api/incomes', body),
  update: (id: string, body: Omit<Income, 'id' | 'createdAt'>) => api.put<Income>(`/api/incomes/${id}`, body),
  delete: (id: string) => api.delete<void>(`/api/incomes/${id}`),
}
```

#### `services/expense.ts`
```ts
import { api } from './api'
import type { Expense } from '../types/income'

export type ExpensePage = { content: Expense[]; totalElements: number; totalPages: number }

export const expenseService = {
  list:   (params?: string) => api.get<ExpensePage>(`/api/expenses${params ? '?' + params : ''}`),
  create: (body: Omit<Expense, 'id' | 'createdAt'>) => api.post<Expense>('/api/expenses', body),
  update: (id: string, body: Omit<Expense, 'id' | 'createdAt'>) => api.put<Expense>(`/api/expenses/${id}`, body),
  delete: (id: string) => api.delete<void>(`/api/expenses/${id}`),
}
```

### Pages

#### `pages/LoginPage.tsx`
- Email + password form
- On submit: call `authService.login()`, store token in `localStorage`, navigate to home
- Link to register page

#### `pages/RegisterPage.tsx`
- Email + password form (password min 8 chars)
- On submit: call `authService.register()`, store token, navigate to home
- Link to login page

### Types — update `types/income.ts`
Add `createdAt: string` to `Income` and `Expense` types (returned from API as ISO instant string).

---

## Files to Modify

### `App.tsx`
- Add `auth` route state and `user` state (email + token)
- On mount: check `localStorage.getItem('auth_token')` → if present, consider logged in
- Replace `useState<Income[]>` + localStorage sync with API calls:
  - `useEffect` on mount → `incomeService.list()` → `setIncomes(page.content)`
  - `addIncome` → `incomeService.create()` → append to state
  - `deleteIncome` → `incomeService.delete()` → filter from state
- Same pattern for expenses
- Add logout handler: `authService.logout()` → clear token → navigate to login
- Render `LoginPage` / `RegisterPage` when not authenticated

### `vite.config.ts` — Add proxy for dev (optional)
```ts
server: {
  proxy: {
    '/api': 'http://localhost:8080',
  },
}
```
With proxy active, set `VITE_API_BASE_URL=''` in `.env.development`.

### Backend — `SecurityConfig.java`
Add CORS bean (also needed for Phase 9):
```java
@Bean
CorsConfigurationSource corsConfigurationSource() {
  CorsConfiguration cfg = new CorsConfiguration();
  cfg.setAllowedOrigins(List.of("http://localhost:5173"));
  cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
  cfg.setAllowedHeaders(List.of("*"));
  CorsConfiguration cfg = new CorsConfiguration();
  UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
  source.registerCorsConfiguration("/api/**", cfg);
  return source;
}
```

---

## Auth Token Strategy

| Decision | Choice | Reason |
|----------|--------|--------|
| Storage | `localStorage` | Simple; acceptable for non-banking app |
| Key | `auth_token` | Single well-known key |
| 401 handling | Clear token + redirect to login | Automatic session expiry UX |
| Logout | Call `/api/auth/logout` then clear token | Revokes JTI on server |

---

## Migration Path (localStorage → API)

1. Keep localStorage reads on first load as a one-time migration (import existing data via POST)
   **OR** simply discard local data and start fresh with the backend
2. Remove `localStorage.setItem` calls for incomes/expenses once API is wired
3. Remove `useEffect` persistence blocks from `App.tsx`

---

## Environment Variables

| Variable | Dev value | Description |
|----------|-----------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend base URL |
| `VITE_RATES_BASE_URL` | (remove — use `/api/rates`) | Point to backend rates endpoint |

---

## Key Design Decisions

- **`localStorage` for token** — `httpOnly` cookie would be more secure but requires backend cookie config and same-origin; `localStorage` is simpler for this stack
- **Optimistic vs pessimistic UI** — pessimistic (wait for API response before updating state) for correctness
- **No React Router** — existing manual route state extended with `login`/`register` routes; no dependency added
- **Vite proxy** — avoids CORS in dev without setting `VITE_API_BASE_URL`; production uses real domain

---

## Verification Steps

```bash
# Start backend
cd backend && ./gradlew bootRun

# Start frontend
cd frontend && npm run dev

# 1. Open http://localhost:5173 → redirected to login
# 2. Register new account → lands on home
# 3. Add income → appears in list (verify in DB)
# 4. Add expense → appears in list (verify in DB)
# 5. Refresh page → data persists (from API, not localStorage)
# 6. Logout → redirected to login; token revoked on server
# 7. Try old token → 401
```
