import { api } from './api'
import type { Expense, Currency, DocumentType, RecurrenceRule } from '../types/income'

export type ExpensePage = {
  content: Expense[]
  totalElements: number
  totalPages: number
  number: number
}

export type CreateExpensePayload = {
  title: string
  amount: number
  currency: Currency
  date: string
  documentType?: DocumentType
  documentId?: string        // links a pre-uploaded OCR document
  recurrenceRule?: RecurrenceRule
}

export const expenseService = {
  list: (params?: string) =>
    api.get<ExpensePage>(`/api/expenses${params ? '?' + params : ''}`),
  create: (body: CreateExpensePayload) =>
    api.post<Expense>('/api/expenses', body),
  update: (id: string, body: { title: string; amount: number; currency: Currency; date: string; documentType?: DocumentType }) =>
    api.put<Expense>(`/api/expenses/${id}`, body),
  delete: (id: string) =>
    api.delete<void>(`/api/expenses/${id}`),
}
