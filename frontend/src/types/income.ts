export type Currency = 'TRY' | 'USD' | 'EUR'
export type DocumentType = 'Receipt' | 'Invoice'
export type OcrStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'
export type RecurrenceRule = 'NONE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export type Income = {
  id: string
  title: string
  amount: number
  currency: Currency
  recurrenceRule?: RecurrenceRule
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
  recurrenceRule?: RecurrenceRule
  card?: string | null       // Nightly Ledger fields — stored as plain names
  category?: string | null
  note?: string | null
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

// ── Nightly Ledger ─────────────────────────────────────────────────────────

export type LedgerOptionKind = 'CARD' | 'CATEGORY'

export type LedgerOption = {
  id: string
  kind: LedgerOptionKind
  name: string
}

export type LedgerOptions = {
  cards: LedgerOption[]
  categories: LedgerOption[]
}

export type LedgerDay = {
  date: string
  expenses: Expense[]
  noSpend: boolean
  totals: Partial<Record<Currency, number>>
}

export type LedgerTotalRow = {
  label: string
  currency: Currency
  total: number
  count: number
  sharePercent: number
}

export type LedgerMonth = {
  year: number
  month: number
  totals: Partial<Record<Currency, number>>
  byCard: LedgerTotalRow[]
  byCategory: LedgerTotalRow[]
  expenses: Expense[]
  noSpendDays: string[]
  missingDays: string[]
}
