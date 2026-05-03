import React, { useState } from 'react'
import { Eye, Home, Loader2, Plus, Receipt, Trash2 } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import BottomNav from '../components/BottomNav'
import type { Expense } from '../types/income'

const selectCls = "block w-full rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors cursor-pointer"

function fmt(value: number, c: string): string {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c as any }).format(value) }
  catch { return `${value.toFixed(2)} ${c}` }
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ExpensesPage({ onHome, onNav, expenses, onDeleteExpense, onAddManual, onCapture, onViewDocument }: {
  onHome: () => void
  onNav: (to: string) => void
  expenses: Expense[]
  onDeleteExpense: (id: string) => void
  onAddManual: () => void
  onCapture: (file: File, source: 'scan' | 'photos' | 'files') => void
  onViewDocument: (documentId: string) => void
}) {
  const now  = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year,  setYear]  = useState(now.getFullYear())

  const allYears = expenses.map(e => parseInt(e.date?.slice(0, 4) || String(now.getFullYear())))
  const minYear  = Math.min(now.getFullYear(), ...allYears)
  const maxYear  = Math.max(now.getFullYear(), ...allYears)
  const years: number[] = []
  for (let y = minYear; y <= maxYear; y++) years.push(y)

  const filtered = expenses.filter(e => {
    if (!e.date) return false
    const d = new Date(e.date)
    return d.getMonth() === month && d.getFullYear() === year
  })

  return (
    <Page
      title="Expenses"
      left={
        <button aria-label="Home" onClick={onHome} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 cursor-pointer transition-colors">
          <Home className="w-4 h-4" />
        </button>
      }
      right={
        <button aria-label="Add expense" onClick={onAddManual} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 cursor-pointer transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      }
    >
      <div className="grid gap-4">
        <Card>
          <div className="flex gap-3">
            <div className="grid gap-1.5 flex-1">
              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Month</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} className={selectCls}>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5 flex-1">
              <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className={selectCls}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
            {MONTHS[month]} {year}
            {filtered.length > 0 && (
              <span className="ml-2 text-xs font-normal text-slate-400 dark:text-gray-500">
                {filtered.filter(e => !e.isPlaceholder).length} expense{filtered.filter(e => !e.isPlaceholder).length !== 1 ? 's' : ''}
              </span>
            )}
          </h2>

          {filtered.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-slate-300 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-gray-400">No expenses for {MONTHS[month]} {year}</p>
              <p className="text-xs text-slate-400 dark:text-gray-500">Use the + button to add one</p>
            </div>
          ) : (
            <div className="grid gap-0.5">
              <div className="grid grid-cols-[1fr_80px_40px_40px] text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide px-1 pb-2 border-b border-slate-100 dark:border-gray-700">
                <div>Title</div>
                <div className="text-right pr-2">Amount</div>
                <div className="text-center">Doc</div>
                <div />
              </div>

              {filtered.map(it => it.isPlaceholder
                ? (
                  <div key={it.id} className="grid grid-cols-[1fr_80px_40px_40px] items-center py-2.5 px-1 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-gray-500 italic col-span-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-indigo-400" />
                      <span>Processing…</span>
                    </div>
                    <div /><div />
                  </div>
                )
                : (
                  <div key={it.id} className="grid grid-cols-[1fr_80px_40px_40px] items-center py-2.5 px-1 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-gray-100 truncate" title={it.title}>{it.title}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-400 dark:text-gray-500">{it.date}</span>
                        {it.recurrenceRule && it.recurrenceRule !== 'NONE' && (
                          <span className="inline-block text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                            {it.recurrenceRule.charAt(0) + it.recurrenceRule.slice(1).toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right pr-2">
                      <div className="text-sm font-semibold text-rose-700 tabular-nums">{fmt(it.amount, it.currency)}</div>
                      <div className="text-[11px] text-slate-400 dark:text-gray-500">{it.currency}</div>
                    </div>
                    <div className="flex justify-center">
                      {it.documentId && (
                        <button
                          aria-label="View document"
                          onClick={() => onViewDocument(it.documentId!)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-300 dark:text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <button
                        aria-label="Delete"
                        onClick={() => onDeleteExpense(it.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-300 dark:text-gray-600 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </Card>
      </div>

      <BottomNav onNav={onNav} onCapture={onCapture} onAddManual={onAddManual} />
    </Page>
  )
}
