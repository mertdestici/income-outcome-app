# Phase 5: Document / File Upload

## Status: Complete ✓

## Overview
Allow users to attach files (receipts, invoices) to expenses. Files are stored on the local filesystem initially. Each uploaded file is tracked in a `documents` table linked to an expense. The frontend already has a capture flow (scan/photos/files) that sends a file — this phase wires it to the backend.

---

## Files to Create

### Flyway Migration
- `V6__create_documents_table.sql`
  ```sql
  CREATE TABLE documents (
      id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      expense_id   UUID         NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_name    VARCHAR(255) NOT NULL,
      file_path    TEXT         NOT NULL,
      content_type VARCHAR(127) NOT NULL,
      size_bytes   BIGINT       NOT NULL,
      uploaded_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );
  CREATE INDEX idx_documents_expense_id ON documents (expense_id);
  CREATE INDEX idx_documents_user_id    ON documents (user_id);
  ```

### Entity
- `entity/Document.java`
  - `UUID id`
  - `@ManyToOne(fetch = LAZY) Expense expense`
  - `@ManyToOne(fetch = LAZY) User user` — denormalized for fast user-scoped queries
  - `String fileName`
  - `String filePath` — absolute path on server filesystem
  - `String contentType` — MIME type (e.g. `image/jpeg`, `application/pdf`)
  - `long sizeBytes`
  - `Instant uploadedAt` — set via `@PrePersist`

### Repository
- `repository/DocumentRepository.java`
  - `List<Document> findByExpenseAndUser(Expense expense, User user)`
  - `Optional<Document> findByIdAndUser(UUID id, User user)`

### DTOs
- `dto/DocumentResponse.java` (record) — `id`, `expenseId`, `fileName`, `contentType`, `sizeBytes`, `uploadedAt`

### Config
- `config/StorageConfig.java` — reads `app.storage.upload-dir` from `application.yml`; creates directory if absent
- Add to `application.yml`:
  ```yaml
  app:
    storage:
      upload-dir: ${user.home}/income-outcome-uploads
      max-file-size-mb: 10
      allowed-types:
        - image/jpeg
        - image/png
        - image/webp
        - application/pdf
  ```
- Add to `application.yml` (Spring multipart):
  ```yaml
  spring:
    servlet:
      multipart:
        max-file-size: 10MB
        max-request-size: 10MB
  ```

### Service
- `service/DocumentService.java`
  - `upload(UUID expenseId, MultipartFile file, User user) → DocumentResponse`
    1. Verify expense belongs to user (404 if not)
    2. Validate content type against allowlist
    3. Validate file size
    4. Generate unique filename: `{UUID}.{extension}`
    5. Save file to `upload-dir/{userId}/{filename}`
    6. Persist `Document` entity
    7. Return `DocumentResponse`
  - `download(UUID id, User user) → Resource`
    1. Fetch `Document` by id + user (404 if not found)
    2. Return `UrlResource` from `filePath`
  - `delete(UUID id, User user) → void`
    1. Fetch document (404 if not found)
    2. Delete file from filesystem
    3. Delete entity

### Controller
- `controller/DocumentController.java` — `@RequestMapping("/api/documents")`
  - `POST /api/documents/upload?expenseId={id}` — `@RequestParam MultipartFile file` → 201 + `DocumentResponse`
  - `GET /api/documents/{id}` — streams file back with correct `Content-Type` and `Content-Disposition`
  - `DELETE /api/documents/{id}` → 204

### Exception
- `exception/InvalidFileException.java` — thrown on bad MIME type or file too large → 400

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/documents/upload?expenseId=` | Bearer | Upload file → 201 + DocumentResponse |
| GET | `/api/documents/{id}` | Bearer | Download/view file |
| DELETE | `/api/documents/{id}` | Bearer | Delete file → 204 |

---

## Key Design Decisions

- **`user_id` denormalized on `documents`** — avoids joining through `expenses` for every auth check; enables fast "all user documents" queries
- **Subdirectory per user** — `upload-dir/{userId}/` prevents filename collisions across users
- **UUID filename on disk** — original filename preserved in DB only; avoids path traversal and filesystem collision
- **Allowlist MIME types** — configurable in `application.yml`; blocks executables at upload time
- **`ON DELETE CASCADE`** — deleting an expense automatically orphans its documents in DB; service layer handles filesystem cleanup on explicit delete
- **Local filesystem first** — Phase 10 migrates to S3-compatible storage; `DocumentService` abstraction makes storage backend swappable

---

## Validation Rules

| Rule | Behavior |
|------|----------|
| File size > 10 MB | 400 InvalidFileException |
| MIME type not in allowlist | 400 InvalidFileException |
| `expenseId` not owned by user | 404 ResourceNotFoundException |
| Document not owned by user | 404 ResourceNotFoundException |

---

## Verification Steps

```bash
# Upload a receipt
curl -X POST "http://localhost:8080/api/documents/upload?expenseId=EXPENSE_ID" \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/receipt.jpg"

# Download it
curl http://localhost:8080/api/documents/DOCUMENT_ID \
  -H "Authorization: Bearer TOKEN" \
  --output receipt.jpg

# Delete it
curl -X DELETE http://localhost:8080/api/documents/DOCUMENT_ID \
  -H "Authorization: Bearer TOKEN"
```
