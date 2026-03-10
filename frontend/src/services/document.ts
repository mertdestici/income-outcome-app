import type { DocumentResponse, OcrStatusResponse } from '../types/income'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_email')
    window.dispatchEvent(new Event('auth:expired'))
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as any).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const documentService = {
  /** Upload linked to an existing expense (backward-compatible). */
  upload: async (expenseId: string, file: File): Promise<DocumentResponse> => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}/api/documents/upload?expenseId=${expenseId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    })
    return handleResponse<DocumentResponse>(res)
  },

  /** Upload without an expense — triggers OCR pipeline on the backend. */
  uploadForOcr: async (file: File): Promise<DocumentResponse> => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}/api/documents/upload/ocr`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    })
    return handleResponse<DocumentResponse>(res)
  },

  /** Poll OCR processing status for a document. */
  getOcrStatus: async (documentId: string): Promise<OcrStatusResponse> => {
    const res = await fetch(`${BASE}/api/documents/${documentId}/ocr-status`, {
      headers: authHeaders(),
    })
    return handleResponse<OcrStatusResponse>(res)
  },

  /** Stream the document file as a blob for in-app preview. */
  getBlobUrl: async (documentId: string): Promise<{ url: string; contentType: string; fileName: string }> => {
    const res = await fetch(`${BASE}/api/documents/${documentId}`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    const fileName = match ? match[1].replace(/['"]/g, '') : documentId
    return {
      url: URL.createObjectURL(blob),
      contentType: res.headers.get('Content-Type') ?? 'application/octet-stream',
      fileName,
    }
  },
}
