import React, { useState } from 'react'
import { X } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import type { Currency } from '../types/income'

const inputCls = "rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"

export default function AddManualExpensePage({ onSave, onCancel }: {
  onSave: (data: { title: string; amount: number; currency: Currency; date: string }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('TRY')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const amountNum = Number(amount)
  const canSave = title.trim().length > 0 && amountNum > 0 && isFinite(amountNum)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    onSave({ title: title.trim(), amount: amountNum, currency, date })
  }

  return (
    <Page title="Add Expense"
      left={<button aria-label="Cancel" onClick={onCancel} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>}
      right={<span />}
    >
      <Card>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3">
          <div className="grid gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor="exp-title">Title</label>
            <input id="exp-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Groceries"
              className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor="exp-amount">Amount</label>
              <input id="exp-amount" type="number" inputMode="decimal" step="0.01" min="0" value={amount}
                onChange={e => setAmount(e.target.value)} placeholder="0.00"
                className={`min-w-0 ${inputCls}`} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor="exp-currency">Currency</label>
              <select id="exp-currency" value={currency} onChange={e => setCurrency(e.target.value as Currency)}
                className={`min-w-0 ${inputCls}`}>
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor="exp-date">Date</label>
            <input id="exp-date" type="date" value={date} onChange={e => setDate(e.target.value)}
              className={inputCls} />
          </div>
          <button type="submit" disabled={!canSave}
            className="rounded-xl bg-red-600 disabled:bg-red-300 text-white px-4 py-2 font-medium active:scale-95">Save Expense</button>
          {!canSave && <div className="text-xs text-red-600">Enter a title and an amount greater than 0.</div>}
        </form>
      </Card>
    </Page>
  )
}
