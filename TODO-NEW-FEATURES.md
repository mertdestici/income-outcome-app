# New Features TODO

Continues from Phase 10. All items below are new work derived from the updated INSTRUCTIONS.md.

---

## Phase 11: Real OCR Integration (Backend)

Replace the existing `NoOpOcrService` stub with a real async OCR pipeline.

### Database
- [ ] Flyway V11: add OCR columns to `documents` table
  - `ocr_status` ENUM (`PENDING`, `PROCESSING`, `DONE`, `FAILED`) — default `PENDING`
  - `ocr_vendor` VARCHAR — extracted merchant/vendor name
  - `ocr_date` DATE — extracted expense date
  - `ocr_amount` NUMERIC(19,4) — extracted expense amount

### OCR Service
- [ ] Implement real `OcrService` (choose one):
  - Option A: **Tesseract** via `tess4j` (local, no API cost)
  - Option B: **Google Cloud Vision API** (higher accuracy, requires key)
  - Option C: **AWS Textract** (best for receipts/invoices, requires AWS creds)
- [ ] `OcrService.extract(filePath)` → returns `OcrResult(vendor, date, amount)`
- [ ] Keep `NoOpOcrService` active by default; real service activates via `app.ocr.provider=tesseract|google|aws`

### Async Processing
- [ ] Enable Spring `@Async` (`@EnableAsync` in config)
- [ ] `OcrAsyncService.processDocument(documentId)` — sets status PROCESSING → calls OcrService → saves result → sets DONE (or FAILED on error)
- [ ] Trigger async job immediately after document is saved (called from `DocumentService`)

### API
- [ ] `GET /api/documents/{id}/ocr-status` — returns `{ status, vendor, date, amount }` for polling
- [ ] Return `ocrStatus` field in the existing `GET /api/documents/{id}` response

---

## Phase 12: OCR UX (Frontend)

### Expenses Page — Async Status Display
- [ ] After submitting a document, start polling `GET /api/documents/{id}/ocr-status` every 500 ms
- [ ] **Fast path (≤ 2–3 s):** Insert a "Processing…" placeholder row in the Expenses table immediately; replace it with real data when polling returns `DONE`
- [ ] **Slow path (> 2–3 s):** Remove the placeholder after the timeout; when polling eventually returns `DONE`, show a toast notification ("Document processed — expense added") and append the new row
- [ ] Show an error toast if status returns `FAILED`; allow the user to enter the expense manually

### OCR Review Screen
- [ ] New screen/modal shown after OCR status becomes `DONE`
- [ ] Pre-filled editable form fields:
  - Vendor / Merchant (text input)
  - Date (date picker)
  - Amount (numeric input)
  - Currency (dropdown — TRY / USD / EUR, default TRY)
  - Document Type (dropdown — Receipt / Invoice, carried forward from upload)
- [ ] **Save** — creates the expense via `POST /api/expenses` and links the document
- [ ] **Close (X)** — cancels without saving (document file is still stored)

---

## Phase 13: Document Viewer (Frontend)

### Expenses Table
- [ ] Add a 6th column to the Expenses table (between Currency and Delete)
- [ ] Show a **View icon button** only for rows that have an associated document (`documentId` is not null)
- [ ] Leave the cell empty for manually entered expenses

### In-App Preview Overlay
- [ ] Fullscreen overlay component (works for both images and PDFs)
  - Images: render with `<img>`
  - PDFs: render with `<iframe>` or a PDF.js viewer
- [ ] **Download button** inside the overlay — triggers file download via the existing `GET /api/documents/{id}` endpoint
- [ ] **Close (X) button** to dismiss the overlay

---

## Phase 14: Monthly PDF Report (Backend)

Compile all documents uploaded during a calendar month into one PDF and email it to the user's configured recipient on the 20th.

### Database
- [ ] Flyway V12: add `report_email` VARCHAR to `users` table (nullable)

### User Settings API
- [ ] `GET /api/settings` — returns `{ reportEmail }` for the authenticated user
- [ ] `PUT /api/settings` — updates `{ reportEmail }`; validates email format

### PDF Generation
- [ ] Add dependency: **iText** or **Apache PDFBox**
- [ ] `PdfReportService.generateMonthlyReport(userId, year, month)`:
  - Queries all documents linked to expenses in that month
  - Appends each document as a page (image → embed, PDF → merge)
  - Returns the compiled PDF as a byte array

### Scheduler
- [ ] `MonthlyReportScheduler` — cron `0 0 8 20 * *` (8:00 AM on the 20th)
  - Iterates users who have a `reportEmail` set
  - Calls `PdfReportService` for the previous month's documents
  - Sends the PDF as an email attachment via `EmailService`
  - Logs success/failure per user in the audit log
- [ ] Guard with `@ConditionalOnBean(EmailService)` (same pattern as `MonthlySummaryScheduler`)

### Email
- [ ] Reuse existing `EmailService`; add `sendMonthlyReport(to, month, pdfBytes)` method
- [ ] Email subject: `"Your [Month Year] Expense Documents"`
- [ ] Email body: brief HTML summary (number of documents, total expense amount)

---

## Phase 15: Settings Page (Frontend)

- [ ] New **Settings** page accessible from the Home page (gear icon or menu)
- [ ] Add Settings route to the manual router in `App.tsx`
- [ ] Page contains:
  - **Report Email** — text input + Save button
    - On load: `GET /api/settings` prefills the field
    - On Save: `PUT /api/settings` updates; show success/error toast
  - Label: "Leave empty to disable monthly email reports"
- [ ] Add Settings navigation entry (home page header or bottom nav overflow menu)
