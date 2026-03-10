# Phase 2: Authentication

## Overview

Stateful JWT authentication with Register, Login, and Logout (server-side token revocation via JTI blacklist). No roles — authenticated vs unauthenticated only. Refresh tokens deferred to a future phase.

---

## Endpoints

| Method | Path | Auth | Request Body | Response |
|--------|------|------|--------------|----------|
| POST | `/api/auth/register` | Public | `{email, password}` | `{token, email}` |
| POST | `/api/auth/login` | Public | `{email, password}` | `{token, email}` |
| POST | `/api/auth/logout` | `Bearer <token>` | — | 200 OK |

All other `/api/**` routes require a valid `Authorization: Bearer <token>` header.

---

## Files Created

### Flyway Migrations
| File | Description |
|------|-------------|
| `V2__create_users_table.sql` | `users(id UUID, email UNIQUE, password_hash, created_at)` |
| `V3__create_revoked_tokens_table.sql` | `revoked_tokens(jti UUID, revoked_at, expires_at)` + index on `expires_at` |

### Entities
| Class | Notes |
|-------|-------|
| `entity/User.java` | Implements `UserDetails`; no roles (`getAuthorities()` → empty list) |
| `entity/RevokedToken.java` | Stores invalidated JTIs for logout |

### Repositories
| Interface | Key Methods |
|-----------|-------------|
| `repository/UserRepository.java` | `findByEmail`, `existsByEmail` |
| `repository/RevokedTokenRepository.java` | `existsByJti`, `deleteByExpiresAtBefore` |

### DTOs
| Class | Fields |
|-------|--------|
| `dto/RegisterRequest.java` | `@Email email`, `@Size(min=8) password` |
| `dto/LoginRequest.java` | `@NotBlank email`, `@NotBlank password` |
| `dto/AuthResponse.java` | `token`, `email` |

### Services
| Class | Responsibilities |
|-------|-----------------|
| `service/JwtService.java` | Generate token (with `jti` UUID claim), extract email/JTI/expiry, validate (signature + expiry + not revoked) |
| `service/AuthService.java` | `register` → BCrypt hash + save + issue token; `login` → authenticate + issue token; `logout` → save JTI to `revoked_tokens` |

### Config
| Class | Responsibilities |
|-------|-----------------|
| `config/JwtAuthFilter.java` | `OncePerRequestFilter`; reads `Authorization: Bearer`, validates token, sets `SecurityContextHolder` |
| `config/SecurityConfig.java` | Permits `/api/auth/**`; requires auth on everything else; stateless session; wires `DaoAuthenticationProvider` + `BCryptPasswordEncoder` |

### Controller
| Class | Routes |
|-------|--------|
| `controller/AuthController.java` | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` |

### Exceptions
| Class | Behaviour |
|-------|-----------|
| `exception/EmailAlreadyExistsException.java` | Thrown by `AuthService.register` when email is taken |
| `exception/GlobalExceptionHandler.java` | `EmailAlreadyExistsException` → 409, `BadCredentialsException` → 401, `MethodArgumentNotValidException` → 400 |

---

## Config Changes

### `application.yml` — JWT block added
```yaml
app:
  jwt:
    secret: ${JWT_SECRET:dev-secret-key-at-least-256-bits-long-replace-in-prod}
    expiration-ms: 86400000   # 24 hours
```

> **Production:** set `JWT_SECRET` environment variable to a secure ≥256-bit string.

---

## Design Decisions

- **JTI blacklist for logout** — each JWT carries a `jti` (UUID) claim; logout persists that JTI to `revoked_tokens`; the filter rejects any token whose JTI is in the table. This avoids keeping server-side sessions while still supporting real logout.
- **`expires_at` on `revoked_tokens`** — mirrors the token's own expiry, enabling a future cleanup job (`deleteByExpiresAtBefore(Instant.now())`) to keep the table small.
- **BCrypt strength 10** — Spring Security default; balances security and register/login latency.
- **No roles** — `getAuthorities()` returns an empty list. RBAC is planned for Phase 10.
- **Refresh tokens deferred** — single 24-hour access token for now; refresh flow will be added in a later phase.

---

## How to Run

```bash
# 1. Start Postgres
cd backend
docker compose up -d

# 2. Start the app (Flyway runs V1→V3 automatically)
./gradlew bootRun
```

## Smoke Tests

```bash
# Register
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' | jq

# Login
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' | jq

# Logout  (replace <token> with value from above)
curl -s -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer <token>"

# Reuse revoked token → should return 403
curl -s -X GET http://localhost:8080/api/some-protected-route \
  -H "Authorization: Bearer <token>"

# Duplicate email → 409
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Wrong password → 401
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrongpassword"}'
```
