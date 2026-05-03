import { api } from './api'
import type { Income, Currency, RecurrenceRule } from '../types/income'

export type IncomePage = {
  content: Income[]
  totalElements: number
  totalPages: number
  number: number
}

export const incomeService = {
  list: (params?: string) =>
    api.get<IncomePage>(`/api/incomes${params ? '?' + params : ''}`),
  create: (body: { title: string; amount: number; currency: Currency; recurrenceRule?: RecurrenceRule }) =>
    api.post<Income>('/api/incomes', body),
  update: (id: string, body: { title: string; amount: number; currency: Currency; recurrenceRule?: RecurrenceRule }) =>
    api.put<Income>(`/api/incomes/${id}`, body),
  delete: (id: string) =>
    api.delete<void>(`/api/incomes/${id}`),
}
