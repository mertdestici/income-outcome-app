# Phase 13: Document Viewer (Frontend)

## Status: Complete

## Overview

Add a **View** icon button to the Expenses table for any expense that has an associated document. Tapping it opens a fullscreen in-app preview overlay. The overlay renders images natively and PDFs via an `<iframe>`. A **Download** button inside the overlay lets the user save the file to their device.

---

## Existing Files to Modify

### `pages/ExpensesPage.tsx`

**Grid change:** `grid-cols-5` → `grid-cols-6`. Insert the View column between Currency and Delete.

Header row update:
```tsx
<div className="grid grid-cols-6 text-xs font-semibold text-gray-600">
  <div>Name</div>
  <div className="text-center">Date</div>
  <div className="text-right">Amount</div>
  <div className="text-center">Currency</div>
  <div className="text-center">Doc</div>
  <div className="text-center">Delete</div>
</div>
```

Data row update:
```tsx
<div key={it.id} className="grid grid-cols-6 items-center text-sm">
  <div className="truncate pr-2" title={it.title}>{it.title}</div>
  <div className="text-center text-xs text-gray-500">{it.date}</div>
  <div className="text-right font-medium">{fmt(it.amount, it.currency)}</div>
  <div className="text-center">{it.currency}</div>

  {/* View button — only shown when the expense has a document */}
  <div className="flex justify-center">
    {it.documentId ? (
      <button
        aria-label="View document"
        onClick={() => onViewDocument(it.documentId!)}
        className="p-1 rounded hover:bg-indigo-50 text-indigo-600"
      >
        <Eye className="w-4 h-4" />
      </button>
    ) : null}
  </div>

  <div className="flex justify-center">
    <button aria-label="Delete" onClick={() => onDeleteExpense(it.id)}
      className="p-1 rounded hover:bg-red-50 text-red-600">
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
</div>
```

Props change — add `onViewDocument`:
```ts
onViewDocument: (documentId: string) => void
```

### `services/document.ts`

Add a helper that returns an authenticated URL for streaming the document:

```ts
// Returns a signed blob URL for in-app preview
export async function getDocumentBlobUrl(documentId: string): Promise<{ url: string; contentType: string }> {
  const token = getToken()
  const response = await fetch(`${API_BASE}/api/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to load document')
  const blob = await response.blob()
  return {
    url: URL.createObjectURL(blob),
    contentType: response.headers.get('Content-Type') ?? 'application/octet-stream',
  }
}
```

> `URL.createObjectURL` requires cleanup — the overlay component must call `URL.revokeObjectURL` on unmount.

### `App.tsx`

Add handler and overlay state:

```ts
const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null)

function handleViewDocument(documentId: string) {
  setPreviewDocumentId(documentId)
}

// Render overlay at root level (above all pages)
{previewDocumentId && (
  <DocumentPreviewOverlay
    documentId={previewDocumentId}
    onClose={() => setPreviewDocumentId(null)}
  />
)}
```

Pass `onViewDocument={handleViewDocument}` to `ExpensesPage`.

---

## New Files to Create

### `components/DocumentPreviewOverlay.tsx`

Fullscreen overlay that fetches and renders the document.

```tsx
import { useEffect, useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import { getDocumentBlobUrl } from '../services/document'

export default function DocumentPreviewOverlay({ documentId, onClose }: {
  documentId: string
  onClose: () => void
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [contentType, setContentType] = useState<string>('')
  const [error, setError] = useState(false)

  useEffect(() => {
    let url: string
    getDocumentBlobUrl(documentId)
      .then(({ url: u, contentType: ct }) => {
        url = u
        setBlobUrl(u)
        setContentType(ct)
      })
      .catch(() => setError(true))

    return () => { if (url) URL.revokeObjectURL(url) }
  }, [documentId])

  const isImage = contentType.startsWith('image/')
  const isPdf   = contentType === 'application/pdf'

  return (
    // Fixed fullscreen backdrop
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60">
        <button onClick={onClose} className="text-white p-1"><X className="w-6 h-6" /></button>
        {blobUrl && (
          <a href={blobUrl} download className="text-white flex items-center gap-1 text-sm">
            <Download className="w-4 h-4" /> Download
          </a>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        {!blobUrl && !error && <Loader2 className="w-8 h-8 text-white animate-spin" />}
        {error && <p className="text-white text-sm">Failed to load document.</p>}

        {blobUrl && isImage && (
          <img src={blobUrl} alt="Document" className="max-w-full max-h-full object-contain rounded" />
        )}

        {blobUrl && isPdf && (
          <iframe src={blobUrl} title="Document" className="w-full h-full rounded border-0" />
        )}

        {blobUrl && !isImage && !isPdf && (
          <p className="text-white text-sm text-center">
            Preview not available for this file type.<br />
            Use the Download button above.
          </p>
        )}
      </div>
    </div>
  )
}
```

---

## Type Update

`types/income.ts` — ensure `Expense` includes `documentId`:

```ts
export interface Expense {
  // ... existing fields
  documentId?: string   // present when expense has an associated document
}
```

This is already introduced in Phase 12; if Phase 13 is implemented before Phase 12, add it here.

---

## Key Design Decisions

- **Blob URL approach** — the `GET /api/documents/{id}` endpoint requires a Bearer token; a plain `<img src="url">` cannot send headers. Fetching via `fetch()` and converting to a blob URL is the correct solution.
- **`URL.revokeObjectURL` on unmount** — prevents memory leaks; must be called after the overlay closes.
- **Download via `<a download>`** — the browser's native download mechanism; works with blob URLs and carries the original filename from `Content-Disposition` if set by the server.
- **PDF via `<iframe>`** — simplest approach without extra dependencies; works in all modern mobile browsers. An alternative would be `pdf.js` for more control, but that adds significant bundle size.
- **Overlay at root level in `App.tsx`** — renders above all pages without z-index conflicts; a single `previewDocumentId` state controls it.

---

## Verification Steps

```
1. Add an expense via document scan/upload (after Phase 11 + 12 are done)
2. Navigate to Expenses page — confirm a View (eye) icon appears in the Doc column for that row
3. Manually added expenses should show no icon in the Doc column
4. Tap the View icon → overlay opens with a loading spinner, then the document renders
5. For an image: confirm it fills the available space and is not distorted
6. For a PDF: confirm the iframe renders it scrollably
7. Tap Download → file downloads to device
8. Tap X → overlay closes, blob URL is revoked (check DevTools Memory for no leaks)
```
