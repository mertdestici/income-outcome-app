import React from 'react'
import { Coins, Settings, Wallet, Receipt } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import RatePill from '../components/RatePill'
import BottomNav from '../components/BottomNav'
import { useLiveRates } from '../services/useLiveRates'
import type { Income, Expense } from '../types/income'

function fmt(value: number, c: string): string {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c as any }).format(value) }
  catch { return `${value.toFixed(2)} ${c}` }
}

export default function HomePage({ onNav, incomes, expenses, onCapture, onAddManual, onLogout, onSettings }: {
  onNav: (to: string) => void
  incomes: Income[]
  expenses: Expense[]
  onCapture: (file: File, source: 'scan' | 'photos' | 'files') => void
  onAddManual: () => void
  onLogout: () => void
  onSettings: () => void
}) {
  const { data, loading, error } = useLiveRates()

  const incomeTRY = incomes.reduce((sum, it) => {
    if (it.currency === 'USD') return sum + it.amount * (data?.USDTRY ?? 0)
    if (it.currency === 'EUR') return sum + it.amount * (data?.EURTRY ?? 0)
    return sum + it.amount
  }, 0)
  const incomeUSD = data?.USDTRY ? incomeTRY / data.USDTRY : 0
  const incomeEUR = data?.EURTRY ? incomeTRY / data.EURTRY : 0

  const expenseTRY = expenses.reduce((sum, it) => {
    if (it.currency === 'USD') return sum + it.amount * (data?.USDTRY ?? 0)
    if (it.currency === 'EUR') return sum + it.amount * (data?.EURTRY ?? 0)
    return sum + it.amount
  }, 0)
  const expenseUSD = data?.USDTRY ? expenseTRY / data.USDTRY : 0
  const expenseEUR = data?.EURTRY ? expenseTRY / data.EURTRY : 0

  return (
    <Page title="Income / Expense" left={<span />} right={
      <div className="flex items-center gap-1">
        <button aria-label="Settings" onClick={onSettings} className="p-1 rounded hover:bg-gray-100">
          <Settings className="w-5 h-5" />
        </button>
        <button onClick={onLogout} className="text-xs text-gray-500 hover:text-red-500 px-2 py-1 rounded">
          Sign out
        </button>
      </div>
    }>
      <div className="grid grid-cols-1 gap-4">
        <button className="text-left" onClick={() => onNav('incomes')}>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5" />
              <h2 className="font-medium">Total Income</h2>
            </div>
            <div className="text-2xl font-semibold">{fmt(incomeTRY, 'TRY')}</div>
            <div className="mt-2 text-sm text-gray-600 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-gray-100 px-2 py-1 text-center">{fmt(incomeTRY, 'TRY')}</div>
              <div className="rounded-lg bg-gray-100 px-2 py-1 text-center">{fmt(incomeUSD, 'USD')}</div>
              <div className="rounded-lg bg-gray-100 px-2 py-1 text-center">{fmt(incomeEUR, 'EUR')}</div>
            </div>
          </Card>
        </button>

        <button className="text-left" onClick={() => onNav('expenses')}>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-5 h-5" />
              <h2 className="font-medium">Total Expenses</h2>
            </div>
            <div className="text-2xl font-semibold">{fmt(expenseTRY, 'TRY')}</div>
            <div className="mt-2 text-sm text-gray-600 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-gray-100 px-2 py-1 text-center">{fmt(expenseTRY, 'TRY')}</div>
              <div className="rounded-lg bg-gray-100 px-2 py-1 text-center">{fmt(expenseUSD, 'USD')}</div>
              <div className="rounded-lg bg-gray-100 px-2 py-1 text-center">{fmt(expenseEUR, 'EUR')}</div>
            </div>
          </Card>
        </button>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5" />
            <h2 className="font-medium">Exchange Rates (30s)</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <RatePill label="TRY/USD" value={data?.USDTRY ?? 0} />
            <RatePill label="TRY/EUR" value={data?.EURTRY ?? 0} />
            <RatePill label="USD/EUR" value={data?.USDEUR ?? 0} />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Last updated: {data ? new Date(data.fetchedAt).toLocaleTimeString() : '—'} (source: ECB)
          </div>
          {(loading || error) && (
            <div className="text-xs text-gray-500 mt-1">
              {loading ? 'Loading rates…' : `Rate error: ${error}`}
            </div>
          )}
        </Card>
      </div>

      <BottomNav onNav={onNav} onCapture={onCapture} onAddManual={onAddManual} />
    </Page>
  )
}
