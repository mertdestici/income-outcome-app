export type Currency = 'TRY' | 'USD' | 'EUR'
export type DocumentType = 'Receipt' | 'Invoice'
export type OcrStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'

export type Income = {
  id: string
  title: string
  amount: number
  currency: Currency
  createdAt?: string
}

export type Expense = {
  id: string
  title: string
  amount: number
  currency: Currency
  date: string
  documentType?: DocumentType
  documentId?: string       // present when linked to an uploaded document
  isPlaceholder?: boolean   // transient UI state only — never sent to API
  createdAt?: string
}

export type DocumentResponse = {
  id: string
  expenseId: string | null
  fileName: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
  ocrStatus: OcrStatus
  ocrVendor: string | null
  ocrDate: string | null
  ocrAmount: number | null
}

export type OcrStatusResponse = {
  status: OcrStatus
  vendor: string | null
  date: string | null
  amount: number | null
}
