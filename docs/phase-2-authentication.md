# Phase 2: Authentication

## Status: Complete ✓

## Overview
Stateless JWT authentication with BCrypt password hashing and JTI-based token blacklist for logout. All `/api/**` routes except `/api/auth/**` require a valid Bearer token.

---

## Files Created

### Flyway Migrations
- `V2__create_users_table.sql` — `users` table: UUID PK, unique email, password_hash, created_at
- `V3__create_revoked_tokens_table.sql` — `revoked_tokens` table: jti UUID PK, revoked_at, expires_at; index on expires_at

### Entities
- `entity/User.java` — implements `UserDetails`; fields: id, email, passwordHash, createdAt
- `entity/RevokedToken.java` — fields: jti (UUID PK), revokedAt, expiresAt

### Repositories
- `repository/UserRepository.java` — `findByEmail`, `existsByEmail`
- `repository/RevokedTokenRepository.java` — `existsByJti`, `deleteByExpiresAtBefore`

### DTOs
- `dto/RegisterRequest.java` — `@Email String email`, `@Size(min=8) String password`
- `dto/LoginRequest.java` — `String email`, `String password`
- `dto/AuthResponse.java` — `String token`, `String email`

### Services
- `service/JwtService.java` — generate / validate / parse tokens; embeds `jti` UUID claim; 24-hour expiry
- `service/AuthService.java` — register (hash password, save user, issue token), login (authenticate, issue token), logout (save jti to blacklist)

### Config
- `config/SecurityConfig.java` — CSRF disabled, stateless sessions, `/api/auth/**` public, all else authenticated; BCrypt bean; `DaoAuthenticationProvider`
- `config/JwtAuthFilter.java` — `OncePerRequestFilter`; validates token, checks JTI blacklist, sets `SecurityContext`

### Exceptions
- `exception/EmailAlreadyExistsException.java`
- `exception/GlobalExceptionHandler.java` — 409 duplicate email, 401 bad credentials, 400 validation errors

---

## Auth Endpoints

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/auth/register` | Public | `{email, password}` | `{token, email}` 201 |
| POST | `/api/auth/login` | Public | `{email, password}` | `{token, email}` 200 |
| POST | `/api/auth/logout` | Bearer | — | 204 |

---

## JWT Design

- Library: JJWT 0.12.6
- Claims: `sub` (email), `jti` (UUID), standard `iat`/`exp`
- Expiry: 24 hours (`app.jwt.expiration-ms=86400000`)
- Secret: dev placeholder in `application.yml`; **prod must set `JWT_SECRET` env var** (≥256-bit)
- Logout: `jti` stored in `revoked_tokens`; filter rejects blacklisted tokens → stateless logout without expiry wait

---

## Key Design Decisions

- **`ddl-auto: validate`** — Hibernate validates schema against Flyway-managed tables; no auto-creation
- **No roles** — `authenticated()` only; RBAC deferred to Phase 10
- **No refresh tokens** — single 24-hour access token; refresh deferred to future phase
- **404 not 403 for missing resources** — avoids leaking existence of records to unauthorized callers
- **JTI blacklist** — only approach for true token revocation without refresh-token infrastructure

---

## Verification

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
# → {"token":"eyJ...","email":"user@example.com"}

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'

# Logout
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer TOKEN"
# → 204

# Attempt reuse of revoked token → 401
curl http://localhost:8080/api/incomes \
  -H "Authorization: Bearer TOKEN"
```
