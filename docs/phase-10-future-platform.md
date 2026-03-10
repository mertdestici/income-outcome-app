# Phase 10: Future / Full Platform

## Status: Complete ✓

## Overview
Long-term enhancements that extend the app into a full financial platform. These are independent tracks that can be prioritized separately. None are required for core functionality.

---

## Track A: Multi-User & Roles

### Goal
Add an `ADMIN` role with access to all users' data. Introduce a user management admin panel.

### Changes

#### Flyway
- `V_X__add_roles.sql`
  ```sql
  ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';
  CREATE INDEX idx_users_role ON users (role);
  ```

#### Entity
- `User.java` — add `@Enumerated(STRING) Role role` field
- `entity/Role.java` — `enum Role { USER, ADMIN }`

#### Security
- `SecurityConfig.java` — add `.requestMatchers("/api/admin/**").hasRole("ADMIN")`
- `JwtService.java` — embed `role` claim in token
- `JwtAuthFilter.java` — read role from token, set `SimpleGrantedAuthority`

#### Admin Controller
- `controller/AdminController.java` — `@RequestMapping("/api/admin")`
  - `GET /api/admin/users` — paginated user list
  - `GET /api/admin/users/{id}/incomes` — any user's incomes
  - `DELETE /api/admin/users/{id}` — delete user + cascade

---

## Track B: Notifications

### Goal
Email users a monthly financial summary report.

### Changes
- Add `spring-boot-starter-mail` dependency
- `service/EmailService.java` — sends HTML email via SMTP
- `scheduler/MonthlySummaryScheduler.java` — runs on first day of each month, calls `ReportService.getSummary()`, emails each user
- Add to `application.yml`:
  ```yaml
  spring.mail:
    host: ${SMTP_HOST}
    port: 587
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    properties.mail.smtp.starttls.enable: true
  ```

---

## Track C: OCR for Receipt Scanning

### Goal
Automatically extract title and amount from uploaded receipt images.

### Approach (Phase 1 — local Tesseract)
- Add `net.sourceforge.tess4j:tess4j` dependency
- `service/OcrService.java`
  - `extract(File imageFile) → OcrResult`
  - Parse amount patterns (e.g. `TOTAL: 123.45`) from extracted text
  - Return `{ title: String, amount: BigDecimal }` as suggestions

### Approach (Phase 2 — cloud OCR)
- Google Vision API or AWS Textract
- Higher accuracy, handles handwriting
- Requires API key + billing

### Integration
- `DocumentService.upload()` — after saving file, call `OcrService.extract()` asynchronously (`@Async`)
- Return OCR suggestions in `DocumentResponse` as optional fields
- Frontend pre-fills the expense form with suggested values

---

## Track D: S3-Compatible File Storage

### Goal
Move from local filesystem to cloud object storage for scalability and persistence across deploys.

### Changes
- Add `software.amazon.awssdk:s3` dependency
- `service/StorageService.java` — interface with `upload()`, `download()`, `delete()` methods
- `service/LocalStorageService.java` — current impl (Phase 5)
- `service/S3StorageService.java` — S3 impl using AWS SDK v2
- `@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")` on S3 impl
- Add to `application-prod.yml`:
  ```yaml
  app:
    storage:
      type: s3
      bucket: income-outcome-files
      region: eu-central-1
  ```
- `DocumentService` depends on `StorageService` interface — no other changes needed

---

## Track E: Audit Log

### Goal
Track all financial mutations (create/update/delete income and expense) for compliance and debugging.

### Changes

#### Flyway
- `V_X__create_audit_log_table.sql`
  ```sql
  CREATE TABLE audit_log (
      id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID         NOT NULL REFERENCES users(id),
      entity_type VARCHAR(50)  NOT NULL,   -- 'INCOME' | 'EXPENSE'
      entity_id   UUID         NOT NULL,
      action      VARCHAR(20)  NOT NULL,   -- 'CREATE' | 'UPDATE' | 'DELETE'
      payload     JSONB,                   -- snapshot of entity before change
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );
  CREATE INDEX idx_audit_user_id    ON audit_log (user_id, created_at DESC);
  CREATE INDEX idx_audit_entity_id  ON audit_log (entity_id);
  ```

#### Implementation
- `entity/AuditLog.java`
- `repository/AuditLogRepository.java`
- `service/AuditService.java` — `log(User, String entityType, UUID entityId, String action, Object payload)`
- Call `auditService.log(...)` from `IncomeService` and `ExpenseService` on each mutation
- `GET /api/admin/audit` — admin-only endpoint to browse audit log

---

## Track F: Recurring Income/Expense

### Goal
Support repeating entries (e.g. monthly salary, rent).

### Changes

#### Flyway
- Add `recurrence_rule` and `next_occurrence` columns to `incomes` and `expenses`

#### Scheduler
- `scheduler/RecurringEntryScheduler.java` — daily job
  - Find all incomes/expenses where `next_occurrence <= TODAY`
  - Create new entry (copy of template)
  - Update `next_occurrence` based on recurrence rule (monthly, weekly, etc.)

#### API
- `CreateIncomeRequest` / `CreateExpenseRequest` — add optional `recurrenceRule` field (`MONTHLY`, `WEEKLY`, `YEARLY`, `NONE`)

---

## Priority Recommendation

| Track | Effort | Value | Suggested Order |
|-------|--------|-------|----------------|
| A — Roles | Medium | Medium | 1st |
| C — OCR | High | High | 2nd |
| D — S3 Storage | Low | High | 3rd |
| B — Notifications | Low | Medium | 4th |
| F — Recurring | Medium | High | 5th |
| E — Audit Log | Low | Medium | 6th |
