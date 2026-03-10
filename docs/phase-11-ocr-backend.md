# Phase 11: Real OCR Integration (Backend)

## Status: Complete

## Overview

Replace the existing `NoOpOcrService` stub with a real async OCR pipeline. When a document is uploaded, it is stored immediately and an async job is dispatched to extract **vendor**, **date**, and **amount** from the file. The frontend polls a status endpoint to track progress. The document can now be uploaded _before_ an expense exists (document-first flow), so `expense_id` on the `documents` table becomes nullable.

---

## Critical Design Decision: Document-First Upload

The current `DocumentService.upload()` requires an existing `expenseId`. In the new OCR flow the user uploads a document _first_; the expense is created _after_ reviewing the OCR results. Two schema and API changes are required:

1. `expense_id` becomes nullable on `documents`.
2. A new upload endpoint that accepts no `expenseId` is added (`POST /api/documents/upload`).
3. When the user confirms the OCR Review Screen, `POST /api/expenses` accepts an optional `documentId` and links the pre-existing document to the new expense.

The old `POST /api/documents/upload?expenseId=` endpoint is kept for backward compatibility (manual expense → attach document flow).

---

## Files to Change

### Flyway Migration

- `V11__ocr_fields_on_documents.sql`
  ```sql
  -- Make expense_id nullable to support document-first upload
  ALTER TABLE documents ALTER COLUMN expense_id DROP NOT NULL;

  -- OCR status tracking
  CREATE TYPE ocr_status AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');
  ALTER TABLE documents
      ADD COLUMN ocr_status   ocr_status   NOT NULL DEFAULT 'PENDING',
      ADD COLUMN ocr_vendor   VARCHAR(255),
      ADD COLUMN ocr_date     DATE,
      ADD COLUMN ocr_amount   NUMERIC(19, 4);

  CREATE INDEX idx_documents_ocr_status ON documents (ocr_status)
      WHERE ocr_status IN ('PENDING', 'PROCESSING');
  ```

### Entity

- `entity/OcrStatus.java` — new enum
  ```java
  public enum OcrStatus { PENDING, PROCESSING, DONE, FAILED }
  ```

- `entity/Document.java` — add fields
  ```java
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "expense_id")   // nullable now
  private Expense expense;

  @Enumerated(EnumType.STRING)
  @Column(name = "ocr_status", nullable = false)
  @Builder.Default
  private OcrStatus ocrStatus = OcrStatus.PENDING;

  @Column(name = "ocr_vendor")
  private String ocrVendor;

  @Column(name = "ocr_date")
  private LocalDate ocrDate;

  @Column(name = "ocr_amount", precision = 19, scale = 4)
  private BigDecimal ocrAmount;

  // Setter needed for async update (Lombok @Setter on these fields or manual)
  public void applyOcrResult(OcrStatus status, String vendor, LocalDate date, BigDecimal amount) {
      this.ocrStatus = status;
      this.ocrVendor = vendor;
      this.ocrDate   = date;
      this.ocrAmount = amount;
  }
  ```

### OcrService Interface

- `service/OcrService.java` — expand `OcrResult`
  ```java
  public interface OcrService {
      record OcrResult(String vendor, LocalDate date, BigDecimal amount) {}
      OcrResult extract(File imageFile);
  }
  ```

### NoOpOcrService

- `service/NoOpOcrService.java` — update to match new signature (still returns nulls; active by default)
  ```java
  @Service
  @ConditionalOnMissingBean(name = "realOcrService")
  public class NoOpOcrService implements OcrService {
      @Override
      public OcrResult extract(File imageFile) {
          return new OcrResult(null, null, null);
      }
  }
  ```

### TesseractOcrService (new — optional activation)

- `service/TesseractOcrService.java`
  - Activated via `@ConditionalOnProperty(name = "app.ocr.provider", havingValue = "tesseract")`
  - Uses `net.sourceforge.tess4j:tess4j`
  - `extract(File imageFile)`:
    1. Run Tesseract on the file to get raw text
    2. Regex-extract amount: patterns like `TOTAL[:\s]+(\d+[.,]\d{2})`, `TUTAR[:\s]+(\d+[.,]\d{2})`
    3. Regex-extract date: `\d{2}[./-]\d{2}[./-]\d{4}` or `\d{4}-\d{2}-\d{2}`
    4. Extract vendor: first non-empty line of text (heuristic)
    5. Return `OcrResult`; on any exception return `OcrResult(null, null, null)`

### OcrAsyncService (new)

- `service/OcrAsyncService.java`
  ```java
  @Service
  @RequiredArgsConstructor
  @Slf4j
  public class OcrAsyncService {
      private final DocumentRepository documentRepository;
      private final OcrService ocrService;
      private final StorageService storageService;

      @Async
      @Transactional
      public void processDocument(UUID documentId) {
          Document doc = documentRepository.findById(documentId).orElse(null);
          if (doc == null) return;

          doc.applyOcrResult(OcrStatus.PROCESSING, null, null, null);
          documentRepository.save(doc);

          try {
              Resource resource = storageService.load(doc.getFilePath());
              File file = resource.getFile();
              OcrService.OcrResult result = ocrService.extract(file);
              doc.applyOcrResult(OcrStatus.DONE, result.vendor(), result.date(), result.amount());
          } catch (Exception e) {
              log.error("OCR failed for document {}: {}", documentId, e.getMessage());
              doc.applyOcrResult(OcrStatus.FAILED, null, null, null);
          }

          documentRepository.save(doc);
      }
  }
  ```

### DocumentService

- `service/DocumentService.java` — add new upload method and OCR trigger
  ```java
  // New: upload without expenseId (document-first flow)
  @Transactional
  public DocumentResponse uploadForOcr(MultipartFile file, User user) throws IOException {
      // validate contentType + size (same logic as existing upload)
      String storageKey = storageService.store(file, user.getId());
      Document document = Document.builder()
              .user(user)
              .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : storageKey)
              .filePath(storageKey)
              .contentType(file.getContentType())
              .sizeBytes(file.getSize())
              .ocrStatus(OcrStatus.PENDING)
              .build();
      Document saved = documentRepository.save(document);
      ocrAsyncService.processDocument(saved.getId()); // fire-and-forget
      return toResponse(saved);
  }

  // New: link document to expense after OCR review
  @Transactional
  public void linkToExpense(UUID documentId, UUID expenseId, User user) {
      Document doc = documentRepository.findByIdAndUser(documentId, user)
              .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
      Expense expense = expenseRepository.findByIdAndUser(expenseId, user)
              .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
      doc.setExpense(expense);
      documentRepository.save(doc);
  }

  // New: OCR status polling
  @Transactional(readOnly = true)
  public OcrStatusResponse getOcrStatus(UUID id, User user) {
      Document doc = documentRepository.findByIdAndUser(id, user)
              .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
      return new OcrStatusResponse(doc.getOcrStatus(), doc.getOcrVendor(),
              doc.getOcrDate(), doc.getOcrAmount());
  }
  ```

### DTOs (new/updated)

- `dto/OcrStatusResponse.java` (new record)
  ```java
  public record OcrStatusResponse(
          OcrStatus status,
          String vendor,
          LocalDate date,
          BigDecimal amount
  ) {}
  ```

- `dto/DocumentResponse.java` — add OCR fields
  ```java
  public record DocumentResponse(
          UUID id,
          UUID expenseId,       // nullable
          String fileName,
          String contentType,
          long sizeBytes,
          Instant uploadedAt,
          OcrStatus ocrStatus,
          String ocrVendor,
          LocalDate ocrDate,
          BigDecimal ocrAmount
  ) {}
  ```

- `dto/CreateExpenseRequest.java` — add optional `documentId`
  ```java
  @Nullable UUID documentId   // links a pre-uploaded document to this expense
  ```

### ExpenseService

- `service/ExpenseService.java` — after creating the expense, if `documentId` is present, call `documentService.linkToExpense()`

### DocumentController

- `controller/DocumentController.java` — new endpoints
  - `POST /api/documents/upload` (no query param) — OCR upload → 201 + `DocumentResponse`
  - `GET /api/documents/{id}/ocr-status` → `OcrStatusResponse`

### Config

- `IncomeOutcomeApplication.java` (or a `@Configuration` class) — add `@EnableAsync`
- `application.yml` — add OCR config block:
  ```yaml
  app:
    ocr:
      provider: none   # none | tesseract | google | aws
  ```
- `build.gradle.kts` — add dependency (Tesseract, conditional):
  ```kotlin
  // Uncomment when provider=tesseract
  // implementation("net.sourceforge.tess4j:tess4j:5.11.0")
  ```

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/documents/upload` | Bearer | Upload document (no expenseId) — triggers OCR → 201 + DocumentResponse |
| POST | `/api/documents/upload?expenseId=` | Bearer | Upload + link to existing expense (backward compat) |
| GET | `/api/documents/{id}/ocr-status` | Bearer | Poll OCR status → OcrStatusResponse |
| POST | `/api/expenses` | Bearer | Create expense; if `documentId` present, links document |

---

## Key Design Decisions

- **`expense_id` nullable** — enables document-first flow; orphaned documents (OCR failed + user cancelled) are cleaned up by a nightly job or on-demand
- **`@Async` + `@Transactional` split** — `DocumentService.uploadForOcr()` commits the document row before `OcrAsyncService` runs so the entity is visible when the async thread fetches it
- **NoOpOcrService stays default** — zero config required in dev; real OCR opt-in via `app.ocr.provider`
- **`TesseractOcrService` as first real impl** — local, no API cost; swap to Google/AWS by adding a second `@ConditionalOnProperty` impl
- **Polling, not WebSocket** — simpler to implement; the frontend polls every 500 ms with a 3-second threshold (Phase 12)

---

## Validation Rules

| Rule | Behavior |
|------|----------|
| File MIME type not in allowlist | 400 InvalidFileException |
| File > 10 MB | 400 InvalidFileException |
| `documentId` in CreateExpenseRequest not owned by user | 404 ResourceNotFoundException |
| OCR fails at runtime | Status set to FAILED; user can still enter data manually |

---

## Verification Steps

```bash
# Upload document without expenseId
curl -X POST http://localhost:8080/api/documents/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/receipt.jpg"
# → { "id": "DOC_ID", "ocrStatus": "PENDING", ... }

# Poll OCR status
curl http://localhost:8080/api/documents/DOC_ID/ocr-status \
  -H "Authorization: Bearer TOKEN"
# → { "status": "DONE", "vendor": "Migros", "date": "2026-02-15", "amount": 142.50 }

# Create expense and link document
curl -X POST http://localhost:8080/api/expenses \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Migros","amount":142.50,"currency":"TRY","date":"2026-02-15","documentId":"DOC_ID"}'
```
