import { api } from './api'
import type { LedgerDay, LedgerMonth, LedgerOption, LedgerOptionKind, LedgerOptions } from '../types/income'

export const ledgerService = {
  options: () =>
    api.get<LedgerOptions>('/api/ledger/options'),
  addOption: (kind: LedgerOptionKind, name: string) =>
    api.post<LedgerOption>('/api/ledger/options', { kind, name }),
  deleteOption: (id: string) =>
    api.delete<void>(`/api/ledger/options/${id}`),
  day: (date: string) =>
    api.get<LedgerDay>(`/api/ledger/day/${date}`),
  markNoSpend: (date: string) =>
    api.put<LedgerDay>(`/api/ledger/day/${date}/no-spend`, {}),
  clearNoSpend: (date: string) =>
    api.delete<LedgerDay>(`/api/ledger/day/${date}/no-spend`),
  month: (year: number, month: number) =>
    api.get<LedgerMonth>(`/api/ledger/month?year=${year}&month=${month}`),
}

/** YYYY-MM-DD in the browser's local timezone (toISOString would give UTC). */
export function localDateStr(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return localDateStr(new Date(y, m - 1, d + days))
}
