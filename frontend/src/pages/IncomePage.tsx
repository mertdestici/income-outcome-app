import React, { useState } from 'react'
import { Home, Trash2 } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import BottomNav from '../components/BottomNav'
import type { Income, Currency } from '../types/income'

function fmt(value: number, c: string): string {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c as any }).format(value) }
  catch { return `${value.toFixed(2)} ${c}` }
}

export default function IncomesPage({ onHome, onNav, incomes, onAddIncome, onDeleteIncome, onCapture, onAddManual }: {
  onHome: () => void
  onNav: (to: string) => void
  incomes: Income[]
  onAddIncome: (i: Omit<Income, 'id'>) => void
  onDeleteIncome: (id: string) => void
  onCapture: (file: File, source: 'scan' | 'photos' | 'files') => void
  onAddManual: () => void
}) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('TRY')

  const amountNum = Number(amount)
  const canSave = title.trim().length > 0 && amountNum > 0 && isFinite(amountNum)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    onAddIncome({ title: title.trim(), amount: amountNum, currency })
    setTitle(''); setAmount(''); setCurrency('TRY')
  }

  return (
    <Page title="Incomes"
      left={<button aria-label="Home" onClick={onHome} className="p-1 rounded hover:bg-gray-100"> <Home className="w-5 h-5" /> </button>}
      right={<span />}
    >
      <Card>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3">
          <div className="grid gap-1">
            <label className="text-sm text-gray-600" htmlFor="title">Title</label>
            <input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Salary"
              className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-sm text-gray-600" htmlFor="amount">Amount</label>
              <input id="amount" type="number" inputMode="decimal" step="0.01" min="0" value={amount}
                onChange={e => setAmount(e.target.value)} placeholder="0.00"
                className="min-w-0 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-gray-600" htmlFor="currency">Currency</label>
              <select id="currency" value={currency} onChange={e => setCurrency(e.target.value as Currency)}
                className="min-w-0 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={!canSave}
            className="rounded-xl bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 font-medium active:scale-95">Save Income</button>
          {!canSave && <div className="text-xs text-red-600">Enter a title and an amount greater than 0.</div>}
        </form>
      </Card>

      <Card>
        {incomes.length === 0 ? (
          <div className="text-sm text-gray-600">No incomes added yet.</div>
        ) : (
          <div className="grid gap-2">
            <div className="grid grid-cols-4 text-xs font-semibold text-gray-600">
              <div>Title</div>
              <div className="text-right">Amount</div>
              <div className="text-center">Currency</div>
              <div className="text-center">Delete</div>
            </div>
            <div className="h-px bg-gray-200" />
            {incomes.map(it => (
              <div key={it.id} className="grid grid-cols-4 items-center text-sm">
                <div className="truncate pr-2" title={it.title}>{it.title}</div>
                <div className="text-right font-medium">{fmt(it.amount, it.currency)}</div>
                <div className="text-center">{it.currency}</div>
                <div className="flex justify-center">
                  <button aria-label="Delete" onClick={() => onDeleteIncome(it.id)} className="p-1 rounded hover:bg-red-50 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <BottomNav onNav={onNav} onCapture={onCapture} onAddManual={onAddManual} />
    </Page>
  )
}
