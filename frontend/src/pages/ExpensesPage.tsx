import React, { useState } from 'react'
import { Eye, Home, Loader2, Plus, Trash2 } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import BottomNav from '../components/BottomNav'
import type { Expense } from '../types/income'

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
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear]   = useState(now.getFullYear())

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
      left={<button aria-label="Home" onClick={onHome} className="p-1 rounded hover:bg-gray-100"><Home className="w-5 h-5" /></button>}
      right={<button aria-label="Add expense" onClick={onAddManual} className="p-1 rounded hover:bg-gray-100"><Plus className="w-5 h-5" /></button>}
    >
      <Card>
        <div className="flex gap-3">
          <div className="grid gap-1 flex-1">
            <label className="text-xs text-gray-500">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="grid gap-1 flex-1">
            <label className="text-xs text-gray-500">Year</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-600">No expenses for {MONTHS[month]} {year}.</div>
        ) : (
          <div className="grid gap-2">
            {/* Header */}
            <div className="grid grid-cols-6 text-xs font-semibold text-gray-600">
              <div>Name</div>
              <div className="text-center">Date</div>
              <div className="text-right">Amount</div>
              <div className="text-center">Currency</div>
              <div className="text-center">Doc</div>
              <div className="text-center">Delete</div>
            </div>
            <div className="h-px bg-gray-200" />

            {filtered.map(it => it.isPlaceholder
              ? (
                // OCR placeholder row — no delete or view, just a spinner
                <div key={it.id} className="grid grid-cols-6 items-center text-sm text-gray-400 italic">
                  <div className="flex items-center gap-1 col-span-2 truncate">
                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                    Processing…
                  </div>
                  <div />
                  <div />
                  <div />
                  <div />
                </div>
              )
              : (
                <div key={it.id} className="grid grid-cols-6 items-center text-sm">
                  <div className="truncate pr-2" title={it.title}>{it.title}</div>
                  <div className="text-center text-xs text-gray-500">{it.date}</div>
                  <div className="text-right font-medium">{fmt(it.amount, it.currency)}</div>
                  <div className="text-center">{it.currency}</div>

                  {/* View button — only for expenses with an associated document */}
                  <div className="flex justify-center">
                    {it.documentId && (
                      <button
                        aria-label="View document"
                        onClick={() => onViewDocument(it.documentId!)}
                        className="p-1 rounded hover:bg-indigo-50 text-indigo-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <button
                      aria-label="Delete"
                      onClick={() => onDeleteExpense(it.id)}
                      className="p-1 rounded hover:bg-red-50 text-red-600"
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

      <BottomNav onNav={onNav} onCapture={onCapture} onAddManual={onAddManual} />
    </Page>
  )
}
