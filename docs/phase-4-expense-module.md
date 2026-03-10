# Phase 4: Expense Module

## Status: Complete ✓

## Overview
Backend CRUD for expenses. Mirrors the income module but adds two extra fields: `date` (the actual expense date, a `LocalDate`) and `documentType` (optional enum: `Receipt | Invoice`). All endpoints are protected by `JwtAuthFilter`. User isolation enforced via `findByIdAndUser`.

---

## Files Created

### Flyway Migration
- `V5__create_expenses_table.sql`
  ```sql
  CREATE TABLE expenses (
      id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title         VARCHAR(255)   NOT NULL,
      amount        NUMERIC(19,4)  NOT NULL,
      currency      VARCHAR(3)     NOT NULL,
      date          DATE           NOT NULL,
      document_type VARCHAR(20),
      created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
  );
  CREATE INDEX idx_expenses_user_id       ON expenses (user_id);
  CREATE INDEX idx_expenses_date          ON expenses (user_id, date);
  CREATE INDEX idx_expenses_currency      ON expenses (user_id, currency);
  CREATE INDEX idx_expenses_document_type ON expenses (user_id, document_type);
  ```

### Enum
- `entity/DocumentType.java` — `enum DocumentType { Receipt, Invoice }`

### Entity
- `entity/Expense.java`
  - `UUID id` — `@GeneratedValue(strategy = UUID)`
  - `@ManyToOne(fetch = LAZY) User user`
  - `String title` — `@Column(nullable = false)`
  - `BigDecimal amount` — `NUMERIC(19,4)`
  - `@Enumerated(STRING) Currency currency`
  - `LocalDate date` — `@Column(nullable = false)`
  - `@Enumerated(STRING) DocumentType documentType` — nullable
  - `Instant createdAt` — set via `@PrePersist`

### Repository
- `repository/ExpenseRepository.java`
  - Single `@Query` with optional-filter pattern (all combinations handled):
    ```java
    @Query("""
        SELECT e FROM Expense e
        WHERE e.user = :user
        AND (:currency IS NULL OR e.currency = :currency)
        AND (:documentType IS NULL OR e.documentType = :documentType)
        AND (:from IS NULL OR e.date >= :from)
        AND (:to IS NULL OR e.date <= :to)
        """)
    Page<Expense> findWithFilters(..., Pageable pageable);
    ```
  - `Optional<Expense> findByIdAndUser(UUID id, User user)`

### DTOs
- `dto/CreateExpenseRequest.java` (record) — `title`, `amount`, `currency`, `date` (@NotNull), `documentType` (nullable)
- `dto/UpdateExpenseRequest.java` (record) — same shape
- `dto/ExpenseResponse.java` (record) — `id`, `title`, `amount`, `currency`, `date`, `documentType`, `createdAt`

### Service
- `service/ExpenseService.java`
  - `create(CreateExpenseRequest, User) → ExpenseResponse`
  - `list(User, Currency?, DocumentType?, Integer month, Integer year, Pageable) → Page<ExpenseResponse>`
    - month + year → computes `from` (first day) / `to` (last day of month)
    - year only → full year range
  - `update(UUID, UpdateExpenseRequest, User) → ExpenseResponse`
  - `delete(UUID, User) → void`

### Controller
- `controller/ExpenseController.java` — `@RequestMapping("/api/expenses")`
  - `POST` → 201 Created
  - `GET` — params: `currency`, `documentType`, `month`, `year`, `page` (0), `size` (20), `sort` (`date,desc`)
  - `PUT /{id}` → 200 OK
  - `DELETE /{id}` → 204 No Content

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/expenses` | Bearer | Create expense → 201 |
| GET | `/api/expenses` | Bearer | List expenses (paginated, filterable) |
| PUT | `/api/expenses/{id}` | Bearer | Update expense → 200 |
| DELETE | `/api/expenses/{id}` | Bearer | Delete expense → 204 |

### GET /api/expenses — Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `currency` | `TRY\|USD\|EUR` | — | Filter by currency |
| `documentType` | `Receipt\|Invoice` | — | Filter by document type |
| `month` | int (1–12) | — | Filter by month (requires `year`) |
| `year` | int | — | Filter by year |
| `page` | int | `0` | Page number (0-based) |
| `size` | int | `20` | Page size |
| `sort` | string | `date,desc` | Sort field and direction |

---

## Key Design Decisions

- **`@Query` with null-guards** — one query handles all 8 filter combinations (3 optional filters) without code branching in the repo layer
- **`LocalDate` not `Instant`** — expense date is a calendar date, not a timestamp; timezone-agnostic
- **`documentType` nullable** — manual expenses have no document; receipts/invoices set this field
- **month/year → date range computed in service** — keeps the query param surface user-friendly
- **User isolation** — `findByIdAndUser` returns 404 for both missing and other-user's expenses (no existence leak)
