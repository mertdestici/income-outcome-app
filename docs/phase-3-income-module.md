# Phase 3: Income Module

## Context
Phase 2 delivered JWT authentication. Phase 3 adds the Income CRUD module — the core domain of the app. All endpoints are protected by the existing `JwtAuthFilter`. User isolation is enforced at the service layer: every query scopes by the authenticated user's id. Currency is a Java enum (TRY, USD, EUR). The User is referenced via `@ManyToOne`.

---

## Files Created

### Flyway Migration
- `V4__create_incomes_table.sql`
  ```sql
  CREATE TABLE incomes (
      id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title      VARCHAR(255)   NOT NULL,
      amount     NUMERIC(19,4)  NOT NULL,
      currency   VARCHAR(3)     NOT NULL,
      created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
  );
  CREATE INDEX idx_incomes_user_id    ON incomes (user_id);
  CREATE INDEX idx_incomes_currency   ON incomes (user_id, currency);
  CREATE INDEX idx_incomes_created_at ON incomes (user_id, created_at);
  ```

### Enum
- `entity/Currency.java` — `enum Currency { TRY, USD, EUR }`

### Entity
- `entity/Income.java`
  - `UUID id` — `@GeneratedValue(strategy = UUID)`
  - `@ManyToOne(fetch = LAZY) @JoinColumn(name = "user_id") User user`
  - `String title` — `@Column(nullable = false)`
  - `BigDecimal amount` — `@Column(nullable = false, precision = 19, scale = 4)`
  - `@Enumerated(EnumType.STRING) Currency currency`
  - `Instant createdAt` — set via `@PrePersist`
  - Lombok: `@Getter @Builder @NoArgsConstructor @AllArgsConstructor`

### Repository
- `repository/IncomeRepository.java`
  - `Page<Income> findByUser(User user, Pageable pageable)`
  - `Page<Income> findByUserAndCurrency(User user, Currency currency, Pageable pageable)`
  - `Page<Income> findByUserAndCreatedAtBetween(User user, Instant from, Instant to, Pageable pageable)`
  - `Page<Income> findByUserAndCurrencyAndCreatedAtBetween(User user, Currency currency, Instant from, Instant to, Pageable pageable)`
  - `Optional<Income> findByIdAndUser(UUID id, User user)`

### DTOs
- `dto/CreateIncomeRequest.java` (record)
  - `@NotBlank String title`
  - `@NotNull @Positive BigDecimal amount`
  - `@NotNull Currency currency`
- `dto/UpdateIncomeRequest.java` (record)
  - `@NotBlank String title`
  - `@NotNull @Positive BigDecimal amount`
  - `@NotNull Currency currency`
- `dto/IncomeResponse.java` (record)
  - `UUID id`, `String title`, `BigDecimal amount`, `Currency currency`, `Instant createdAt`

### Exceptions
- `exception/ResourceNotFoundException.java` — `RuntimeException` thrown when income not found or doesn't belong to user

### Service
- `service/IncomeService.java` — `@Service @RequiredArgsConstructor`
  - `create(CreateIncomeRequest, User) → IncomeResponse`
  - `list(User, Currency?, Instant? from, Instant? to, Pageable) → Page<IncomeResponse>`
  - `update(UUID id, UpdateIncomeRequest, User) → IncomeResponse`
  - `delete(UUID id, User) → void`
  - Private `toResponse(Income) → IncomeResponse` mapper

### Controller
- `controller/IncomeController.java` — `@RestController @RequestMapping("/api/incomes") @RequiredArgsConstructor`
  - `POST /api/incomes` — `@Valid @RequestBody CreateIncomeRequest` → `201 Created` with `IncomeResponse`
  - `GET /api/incomes` — query params: `currency` (optional), `from` (optional ISO instant), `to` (optional ISO instant), `page` (default 0), `size` (default 20), `sort` (default `createdAt,desc`) → `Page<IncomeResponse>`
  - `PUT /api/incomes/{id}` — `@Valid @RequestBody UpdateIncomeRequest` → `200 OK` with `IncomeResponse`
  - `DELETE /api/incomes/{id}` → `204 No Content`
  - Authenticated user extracted via `(User) SecurityContextHolder.getContext().getAuthentication().getPrincipal()`

---

## Files Modified

### `exception/GlobalExceptionHandler.java`
Added handler:
- `ResourceNotFoundException` → `404 NOT_FOUND` with `{"error": message}`

---

## Key Design Decisions

- **User isolation** — `findByIdAndUser` used for update/delete so a user can never touch another user's income (returns 404, not 403, to avoid leaking existence)
- **Combined filter via derived query methods** — four `findBy…` variants in the repo cover all filter combinations cleanly without `@Query`
- **`NUMERIC(19,4)`** — standard precision for monetary amounts
- **`@Enumerated(EnumType.STRING)`** — stores `"TRY"` not `0` in DB; readable and migration-safe
- **`201 Created`** on POST — correct HTTP semantics for resource creation
- **`204 No Content`** on DELETE — no body returned
- **Default sort `createdAt,desc`** — newest income first

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/incomes` | Bearer token | Create income → `201` + `IncomeResponse` |
| GET | `/api/incomes` | Bearer token | List incomes (paginated, filterable) → `Page<IncomeResponse>` |
| PUT | `/api/incomes/{id}` | Bearer token | Update income → `200` + `IncomeResponse` |
| DELETE | `/api/incomes/{id}` | Bearer token | Delete income → `204` |

### GET /api/incomes — Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `currency` | `TRY\|USD\|EUR` | — | Filter by currency |
| `from` | ISO instant | — | Filter by created_at >= from |
| `to` | ISO instant | — | Filter by created_at <= to |
| `page` | int | `0` | Page number (0-based) |
| `size` | int | `20` | Page size |
| `sort` | string | `createdAt,desc` | Sort field and direction |

---

## File Structure After Phase 3

```
entity/
  Currency.java       ← new
  Income.java         ← new
  User.java
  RevokedToken.java

repository/
  IncomeRepository.java   ← new
  UserRepository.java
  RevokedTokenRepository.java

dto/
  CreateIncomeRequest.java  ← new
  UpdateIncomeRequest.java  ← new
  IncomeResponse.java       ← new
  RegisterRequest.java
  LoginRequest.java
  AuthResponse.java

service/
  IncomeService.java  ← new
  AuthService.java
  JwtService.java

controller/
  IncomeController.java  ← new
  AuthController.java

exception/
  ResourceNotFoundException.java  ← new
  GlobalExceptionHandler.java     ← modified (+1 handler)
  EmailAlreadyExistsException.java

db/migration/
  V4__create_incomes_table.sql  ← new
```

---

## Verification Steps

```bash
# 1. Start Postgres
cd backend
docker compose up -d

# 2. Start app — Flyway runs V4
./gradlew bootRun

# 3. Register and get a token
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}'

# 4. Create an income (replace TOKEN)
curl -X POST http://localhost:8080/api/incomes \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Salary","amount":5000.00,"currency":"USD"}'

# 5. List incomes
curl http://localhost:8080/api/incomes \
  -H "Authorization: Bearer TOKEN"

# 6. Filter by currency
curl "http://localhost:8080/api/incomes?currency=USD" \
  -H "Authorization: Bearer TOKEN"

# 7. Filter by date range
curl "http://localhost:8080/api/incomes?from=2026-01-01T00:00:00Z&to=2026-12-31T23:59:59Z" \
  -H "Authorization: Bearer TOKEN"

# 8. Update an income (replace ID)
curl -X PUT http://localhost:8080/api/incomes/ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Salary Updated","amount":5500.00,"currency":"USD"}'

# 9. Delete an income (replace ID)
curl -X DELETE http://localhost:8080/api/incomes/ID \
  -H "Authorization: Bearer TOKEN"

# 10. Confirm 404 on deleted/other user's income
curl http://localhost:8080/api/incomes/ID \
  -H "Authorization: Bearer TOKEN"

# 11. Run tests
./gradlew test
```
