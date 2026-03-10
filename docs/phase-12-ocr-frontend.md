# Phase 12: OCR UX (Frontend)

## Status: Complete

## Overview

Wire the frontend to the async OCR pipeline introduced in Phase 11. After a user submits a document via Scan Document, Add From Photos, or Add From Files, the file is uploaded and OCR processing begins. The Expenses page shows a "Processing…" placeholder row for fast completions (≤ 3 s) or a toast notification for slower ones. When OCR finishes, the user is taken to an **OCR Review Screen** to confirm or correct the extracted data before the expense is saved.

---

## Existing Files to Modify

### `services/document.ts`

Add two new API calls:

```ts
// Upload document without an expenseId (OCR flow)
export async function uploadDocumentForOcr(file: File): Promise<DocumentResponse> {
  const form = new FormData()
  form.append('file', file)
  return apiFetch('/api/documents/upload', { method: 'POST', body: form })
}

// Poll OCR status
export async function getOcrStatus(documentId: string): Promise<OcrStatusResponse> {
  return apiFetch(`/api/documents/${documentId}/ocr-status`)
}
```

New types to add to `types/income.ts` (or a new `types/document.ts`):

```ts
export type OcrStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'

export interface DocumentResponse {
  id: string
  expenseId: string | null
  fileName: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
  ocrStatus: OcrStatus
  ocrVendor: string | null
  ocrDate: string | null    // ISO date string
  ocrAmount: number | null
}

export interface OcrStatusResponse {
  status: OcrStatus
  vendor: string | null
  date: string | null
  amount: number | null
}
```

### `services/expense.ts`

Update `createExpense` to accept optional `documentId`:

```ts
export interface CreateExpensePayload {
  title: string
  amount: number
  currency: Currency
  date: string
  documentType?: string
  documentId?: string   // links a pre-uploaded document
}
```

### `pages/AddDocumentPage.tsx`

Current: Save button calls `onSave({ name, documentType })` synchronously.

New flow:
1. Save button calls `uploadDocumentForOcr(capturedFile)` (file comes from props, passed down from capture flow in `App.tsx`)
2. Show inline loading spinner on the button while uploading
3. On success: call `onUploaded(documentId, documentType)` — navigates to the processing/polling state in `App.tsx`
4. On error: show error message, keep form open

Props change:
```ts
// Before
onSave: (data: { name: string; documentType: DocumentType }) => void

// After
capturedFile: File
onUploaded: (documentId: string, documentType: DocumentType) => void
onCancel: () => void
```

### `App.tsx`

Add two new routes and OCR state:

```ts
type Route = 'home' | 'incomes' | 'expenses' | 'add-manual-expense'
           | 'confirm-capture' | 'add-document' | 'ocr-review' | 'settings'

// New state
const [ocrDocumentId, setOcrDocumentId] = useState<string | null>(null)
const [ocrDocumentType, setOcrDocumentType] = useState<DocumentType>('Receipt')
const [pendingOcrExpense, setPendingOcrExpense] = useState<OcrStatusResponse | null>(null)
```

New handler after `AddDocumentPage` saves:
```ts
async function handleDocumentUploaded(documentId: string, documentType: DocumentType) {
  setOcrDocumentId(documentId)
  setOcrDocumentType(documentType)
  startOcrPolling(documentId, documentType)  // see below
}
```

OCR polling logic (inside `App.tsx` or extracted to `services/useOcrPolling.ts`):
```ts
function startOcrPolling(documentId: string, documentType: DocumentType) {
  const startTime = Date.now()
  const FAST_THRESHOLD_MS = 3000
  let showPlaceholder = false

  // Add placeholder row immediately, but only show it after 200ms
  // to avoid flash for very fast responses
  const placeholderTimer = setTimeout(() => {
    showPlaceholder = true
    addExpensePlaceholder(documentId)   // adds { id: documentId, title: 'Processing…', isPlaceholder: true }
  }, 200)

  const interval = setInterval(async () => {
    const status = await getOcrStatus(documentId)

    if (status.status === 'DONE' || status.status === 'FAILED') {
      clearInterval(interval)
      clearTimeout(placeholderTimer)

      const elapsed = Date.now() - startTime

      if (showPlaceholder) {
        removeExpensePlaceholder(documentId)
      }

      if (elapsed > FAST_THRESHOLD_MS && !showPlaceholder) {
        // Slow path: show toast
        showToast('Document processed — tap to review')
      }

      if (status.status === 'DONE') {
        setPendingOcrExpense(status)
        setRoute('ocr-review')
      } else {
        // FAILED: navigate to manual expense with a warning
        showToast('Could not read document — please enter details manually', 'error')
        setRoute('add-manual-expense')
      }
    }
  }, 500)
}
```

---

## New Files to Create

### `pages/OcrReviewPage.tsx`

Pre-filled form with extracted data; user can edit before saving the expense.

```tsx
export default function OcrReviewPage({ ocrResult, documentId, documentType, onSave, onCancel }: {
  ocrResult: OcrStatusResponse
  documentId: string
  documentType: DocumentType
  onSave: (expense: CreateExpensePayload) => void
  onCancel: () => void
})
```

Fields:
- **Vendor / Merchant** — `<input>` pre-filled with `ocrResult.vendor ?? ''`
- **Date** — `<input type="date">` pre-filled with `ocrResult.date ?? today`
- **Amount** — `<input type="number">` pre-filled with `ocrResult.amount ?? ''`
- **Currency** — `<select>` TRY / USD / EUR, default TRY
- **Document Type** — `<select>` Receipt / Invoice, pre-filled from `documentType` prop
- **Save** — calls `onSave({ title: vendor, amount, currency, date, documentId, documentType })`
- **X (close)** — calls `onCancel()` (document stays stored; expense is not created)

### `components/Toast.tsx`

Simple toast notification component (bottom-center, auto-dismisses after 4 s):

```tsx
export default function Toast({ message, type, onDismiss }: {
  message: string
  type: 'info' | 'error'
  onDismiss: () => void
})
```

Mounted at the root in `App.tsx` when `toastMessage` state is non-null.

### `services/useOcrPolling.ts` (optional extraction)

Custom hook that encapsulates the polling logic if `App.tsx` grows too large:

```ts
export function useOcrPolling(documentId: string | null, onDone: (result: OcrStatusResponse) => void, onFailed: () => void)
```

---

## Expense Type Update

`types/income.ts` — add optional fields to `Expense`:

```ts
export interface Expense {
  id: string
  title: string
  amount: number
  currency: Currency
  date: string
  documentType?: DocumentType
  documentId?: string        // set when expense has an associated document
  isPlaceholder?: boolean    // transient — used only in UI state
}
```

---

## Key Design Decisions

- **Placeholder timer at 200 ms** — prevents a distracting flash for near-instant responses while still catching the ≤ 3 s fast path
- **FAILED → manual entry** — if OCR fails the user is redirected to `AddManualExpensePage` with a toast; no data is lost (the file is still stored)
- **Polling interval 500 ms** — low enough to feel responsive, high enough to avoid hammering the server; stop polling immediately on DONE/FAILED
- **Cancel on OcrReviewPage does not delete the document** — the stored file is an asset; cleanup of orphaned documents is a backend concern (nightly job, Phase 11)
- **Toast extracted as a component** — keeps `App.tsx` clean; only one toast is shown at a time

---

## Verification Steps

```
1. Upload a receipt via "Add From Files" flow
2. Observe "Processing…" row appears in Expenses page within 200 ms
3. Within ~3 s the row disappears and OCR Review Screen opens with pre-filled fields
4. Edit one field, tap Save → expense row appears in Expenses page with correct data
5. Repeat with a slow OCR (mock delay > 3 s in dev): no placeholder, toast appears after done
6. Simulate FAILED OCR: toast error + redirect to manual expense form
```
