import React, { useState } from 'react'
import { Home, Trash2, Wallet } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import BottomNav from '../components/BottomNav'
import type { Income, Currency, RecurrenceRule } from '../types/income'

const inputCls = "block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
const selectCls = "block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors cursor-pointer"
const labelCls = "text-sm font-medium text-slate-700"

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
  const [title,          setTitle]          = useState('')
  const [amount,         setAmount]         = useState('')
  const [currency,       setCurrency]       = useState<Currency>('TRY')
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>('NONE')

  const amountNum = Number(amount)
  const canSave   = title.trim().length > 0 && amountNum > 0 && isFinite(amountNum)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    onAddIncome({ title: title.trim(), amount: amountNum, currency, recurrenceRule })
    setTitle(''); setAmount(''); setCurrency('TRY'); setRecurrenceRule('NONE')
  }

  return (
    <Page
      title="Income"
      left={
        <button aria-label="Home" onClick={onHome} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors">
          <Home className="w-4 h-4" />
        </button>
      }
      right={<span />}
    >
      <div className="grid gap-4">
        <Card>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Add Income</h2>
          <form onSubmit={submit} className="grid gap-3">
            <div className="grid gap-1.5">
              <label className={labelCls} htmlFor="title">Title</label>
              <input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Salary"
                className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className={labelCls} htmlFor="amount">Amount</label>
                <input id="amount" type="number" inputMode="decimal" step="0.01" min="0" value={amount}
                  onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className={inputCls} />
              </div>
              <div className="grid gap-1.5">
                <label className={labelCls} htmlFor="currency">Currency</label>
                <select id="currency" value={currency} onChange={e => setCurrency(e.target.value as Currency)}
                  className={selectCls}>
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <label className={labelCls} htmlFor="recurrence">Repeat</label>
              <select id="recurrence" value={recurrenceRule} onChange={e => setRecurrenceRule(e.target.value as RecurrenceRule)}
                className={selectCls}>
                <option value="NONE">One-time</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <button type="submit" disabled={!canSave}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white px-4 py-3 font-semibold cursor-pointer active:scale-[0.98] transition-all duration-150 mt-1">
              Save Income
            </button>
            {!canSave && title.trim().length === 0 && amount.length > 0 && (
              <p className="text-xs text-red-500">Enter a title.</p>
            )}
          </form>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            {incomes.length > 0 ? `${incomes.length} income${incomes.length === 1 ? '' : 's'}` : 'Income List'}
          </h2>
          {incomes.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No incomes yet</p>
              <p className="text-xs text-slate-400">Add your first income above</p>
            </div>
          ) : (
            <div className="grid gap-0.5">
              <div className="grid grid-cols-[1fr_auto_56px_40px] text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 pb-2 border-b border-slate-100">
                <div>Title</div>
                <div className="text-right pr-3">Amount</div>
                <div className="text-center">CCY</div>
                <div />
              </div>
              {incomes.map(it => (
                <div key={it.id} className="grid grid-cols-[1fr_auto_56px_40px] items-center py-2.5 px-1 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="pr-2 min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900" title={it.title}>{it.title}</div>
                    {it.recurrenceRule && it.recurrenceRule !== 'NONE' && (
                      <span className="inline-block text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md mt-0.5">
                        {it.recurrenceRule.charAt(0) + it.recurrenceRule.slice(1).toLowerCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-right text-sm font-semibold text-emerald-700 tabular-nums pr-3">{fmt(it.amount, it.currency)}</div>
                  <div className="text-center text-xs text-slate-400 font-medium">{it.currency}</div>
                  <div className="flex justify-center">
                    <button
                      aria-label="Delete"
                      onClick={() => onDeleteIncome(it.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <BottomNav onNav={onNav} onCapture={onCapture} onAddManual={onAddManual} />
    </Page>
  )
}
