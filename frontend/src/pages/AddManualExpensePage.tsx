import React, { useState } from 'react'
import { X } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import type { Currency, RecurrenceRule } from '../types/income'

const inputCls = "block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
const selectCls = "block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors cursor-pointer"
const labelCls = "text-sm font-medium text-slate-700"

export default function AddManualExpensePage({ onSave, onCancel }: {
  onSave: (data: { title: string; amount: number; currency: Currency; date: string; recurrenceRule: RecurrenceRule }) => void
  onCancel: () => void
}) {
  const [title,          setTitle]          = useState('')
  const [amount,         setAmount]         = useState('')
  const [currency,       setCurrency]       = useState<Currency>('TRY')
  const [date,           setDate]           = useState(() => new Date().toISOString().slice(0, 10))
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>('NONE')

  const amountNum = Number(amount)
  const canSave   = title.trim().length > 0 && amountNum > 0 && isFinite(amountNum)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    onSave({ title: title.trim(), amount: amountNum, currency, date, recurrenceRule })
  }

  return (
    <Page
      title="Add Expense"
      left={
        <button aria-label="Cancel" onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors">
          <X className="w-4 h-4" />
        </button>
      }
      right={<span />}
    >
      <Card>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <label className={labelCls} htmlFor="exp-title">Title</label>
            <input id="exp-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Groceries"
              className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className={labelCls} htmlFor="exp-amount">Amount</label>
              <input id="exp-amount" type="number" inputMode="decimal" step="0.01" min="0" value={amount}
                onChange={e => setAmount(e.target.value)} placeholder="0.00"
                className={inputCls} />
            </div>
            <div className="grid gap-1.5">
              <label className={labelCls} htmlFor="exp-currency">Currency</label>
              <select id="exp-currency" value={currency} onChange={e => setCurrency(e.target.value as Currency)}
                className={selectCls}>
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <label className={labelCls} htmlFor="exp-date">Date</label>
            <input id="exp-date" type="date" value={date} onChange={e => setDate(e.target.value)}
              className={inputCls} />
          </div>
          <div className="grid gap-1.5">
            <label className={labelCls} htmlFor="exp-recurrence">Repeat</label>
            <select id="exp-recurrence" value={recurrenceRule} onChange={e => setRecurrenceRule(e.target.value as RecurrenceRule)}
              className={selectCls}>
              <option value="NONE">One-time</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          {!canSave && (title.trim().length === 0 && amount.length > 0) && (
            <p className="text-xs text-red-500">Enter a title and an amount greater than 0.</p>
          )}

          <button type="submit" disabled={!canSave}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-rose-600 disabled:bg-rose-300 disabled:cursor-not-allowed text-white px-4 py-3 font-semibold cursor-pointer active:scale-[0.98] transition-all duration-150 mt-1">
            Save Expense
          </button>
        </form>
      </Card>
    </Page>
  )
}
