import React from 'react'
import { Coins, Settings, Wallet, Receipt, ChevronRight, Loader2, LogOut } from 'lucide-react'
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

  const netTRY      = incomeTRY - expenseTRY
  const isPositive  = netTRY >= 0

  return (
    <Page
      title="Overview"
      left={<span />}
      right={
        <div className="flex items-center gap-0.5">
          <button aria-label="Settings" onClick={onSettings} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={onLogout} aria-label="Sign out" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-rose-500 cursor-pointer transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="grid gap-4">

        {/* Net Balance Hero */}
        <div className={`rounded-2xl p-5 shadow-md ${isPositive
          ? 'bg-gradient-to-br from-indigo-600 to-indigo-800'
          : 'bg-gradient-to-br from-rose-600 to-rose-800'
        } text-white`}>
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm font-medium text-white/70">Net Balance</p>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20">
              {isPositive ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <p className="text-3xl font-bold tabular-nums tracking-tight mt-1">
            {!isPositive && <span className="mr-0.5">−</span>}
            {fmt(Math.abs(netTRY), 'TRY')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/10 px-3 py-2.5">
              <p className="text-xs font-medium text-white/60 mb-0.5">Income</p>
              <p className="text-sm font-semibold tabular-nums">{fmt(incomeTRY, 'TRY')}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2.5">
              <p className="text-xs font-medium text-white/60 mb-0.5">Expenses</p>
              <p className="text-sm font-semibold tabular-nums">{fmt(expenseTRY, 'TRY')}</p>
            </div>
          </div>
        </div>

        {/* Income Card */}
        <button className="text-left w-full cursor-pointer active:scale-[0.99] transition-transform" onClick={() => onNav('incomes')}>
          <Card className="transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-semibold text-slate-900">Income</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-2xl font-bold text-emerald-700 tabular-nums tracking-tight">
              {fmt(incomeTRY, 'TRY')}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {[['TRY', incomeTRY], ['USD', incomeUSD], ['EUR', incomeEUR]].map(([c, v]) => (
                <div key={c as string} className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                  <span className="text-xs font-medium text-slate-500 tabular-nums">{fmt(v as number, c as string)}</span>
                </div>
              ))}
            </div>
          </Card>
        </button>

        {/* Expenses Card */}
        <button className="text-left w-full cursor-pointer active:scale-[0.99] transition-transform" onClick={() => onNav('expenses')}>
          <Card className="transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5 text-rose-600" />
                </div>
                <span className="font-semibold text-slate-900">Expenses</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-2xl font-bold text-rose-700 tabular-nums tracking-tight">
              {fmt(expenseTRY, 'TRY')}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {[['TRY', expenseTRY], ['USD', expenseUSD], ['EUR', expenseEUR]].map(([c, v]) => (
                <div key={c as string} className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                  <span className="text-xs font-medium text-slate-500 tabular-nums">{fmt(v as number, c as string)}</span>
                </div>
              ))}
            </div>
          </Card>
        </button>

        {/* Exchange Rates */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="font-semibold text-slate-900">Exchange Rates</span>
            </div>
            {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <RatePill label="TRY/USD" value={data?.USDTRY ?? 0} />
            <RatePill label="TRY/EUR" value={data?.EURTRY ?? 0} />
            <RatePill label="USD/EUR" value={data?.USDEUR ?? 0} />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
            <span>Updated {data ? new Date(data.fetchedAt).toLocaleTimeString() : '—'}</span>
            <span>ECB · 30s refresh</span>
          </div>
          {error && <p className="text-xs text-rose-500 mt-1.5">Rate error: {error}</p>}
        </Card>

      </div>

      <BottomNav onNav={onNav} onCapture={onCapture} onAddManual={onAddManual} />
    </Page>
  )
}
