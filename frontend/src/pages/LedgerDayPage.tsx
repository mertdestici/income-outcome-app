import React, { useEffect, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, CircleSlash, Home, Loader2, Table2, Trash2, Undo2 } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import BottomNav from '../components/BottomNav'
import type { Currency, Expense, LedgerDay, LedgerOptions } from '../types/income'
import type { CreateExpensePayload } from '../services/expense'
import { ledgerService, localDateStr, shiftDate } from '../services/ledger'

const inputCls = "block w-full rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
const selectCls = "block w-full rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors cursor-pointer"
const labelCls = "text-sm font-medium text-slate-700 dark:text-gray-300"
const iconBtn  = "p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"

function fmt(value: number, c: string): string {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c as any }).format(value) }
  catch { return `${value.toFixed(2)} ${c}` }
}

function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

// Last-used currency / card / category — a per-browser convenience only
const PREFS_KEY = 'ledger_last_used'
type Prefs = { currency: Currency; card: string; category: string }
function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return { currency: 'TRY', card: '', category: '', ...JSON.parse(raw) }
  } catch {}
  return { currency: 'TRY', card: '', category: '' }
}
function savePrefs(p: Prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)) } catch {}
}

export default function LedgerDayPage({ date, onDateChange, onHome, onMonth, onNav, onCapture, onAddManual,
                                        onAddExpense, onDeleteExpense, onToast }: {
  date: string
  onDateChange: (date: string) => void
  onHome: () => void
  onMonth: () => void
  onNav: (to: string) => void
  onCapture: (file: File, source: 'scan' | 'photos' | 'files') => void
  onAddManual: () => void
  onAddExpense: (payload: CreateExpensePayload) => Promise<Expense>
  onDeleteExpense: (id: string) => Promise<void>
  onToast: (message: string, type: 'info' | 'error') => void
}) {
  const prefs = loadPrefs()
  const [day,      setDay]      = useState<LedgerDay | null>(null)
  const [options,  setOptions]  = useState<LedgerOptions>({ cards: [], categories: [] })
  const [amount,   setAmount]   = useState('')
  const [currency, setCurrency] = useState<Currency>(prefs.currency)
  const [card,     setCard]     = useState(prefs.card)
  const [category, setCategory] = useState(prefs.category)
  const [note,     setNote]     = useState('')
  const [busy,     setBusy]     = useState(false)

  const today   = localDateStr()
  const isToday = date >= today

  useEffect(() => {
    ledgerService.options().then(setOptions).catch(() => {})
  }, [])

  useEffect(() => {
    setDay(null)
    ledgerService.day(date).then(setDay).catch(() => onToast('Failed to load day', 'error'))
  }, [date])

  // Drop remembered picks that were removed from the lists
  const cardNames     = options.cards.map(o => o.name)
  const categoryNames = options.categories.map(o => o.name)
  const cardValue     = cardNames.includes(card) ? card : ''
  const categoryValue = categoryNames.includes(category) ? category : ''

  const amountNum = Number(amount)
  const canSave   = amountNum > 0 && isFinite(amountNum) && !busy

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    setBusy(true)
    try {
      await onAddExpense({
        title:    categoryValue || cardValue || 'Expense',
        amount:   amountNum,
        currency,
        date,
        card:     cardValue || undefined,
        category: categoryValue || undefined,
        note:     note.trim() || undefined,
      })
      savePrefs({ currency, card: cardValue, category: categoryValue })
      setAmount('')
      setNote('')
      setDay(await ledgerService.day(date))
    } catch {
      onToast('Failed to save expense', 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await onDeleteExpense(id)
      setDay(await ledgerService.day(date))
    } catch {
      onToast('Failed to delete expense', 'error')
    }
  }

  const toggleNoSpend = async () => {
    if (!day) return
    setBusy(true)
    try {
      setDay(day.noSpend ? await ledgerService.clearNoSpend(date) : await ledgerService.markNoSpend(date))
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to update day', 'error')
    } finally {
      setBusy(false)
    }
  }

  const totals = Object.entries(day?.totals ?? {}) as [Currency, number][]

  return (
    <Page
      title="Daily Log"
      left={<button aria-label="Home" onClick={onHome} className={iconBtn}><Home className="w-4 h-4" /></button>}
      right={<button aria-label="Month table" onClick={onMonth} className={iconBtn}><Table2 className="w-4 h-4" /></button>}
    >
      <div className="grid gap-4">
        {/* Day stepper + total */}
        <Card>
          <div className="flex items-center justify-between gap-2">
            <button aria-label="Previous day" onClick={() => onDateChange(shiftDate(date, -1))} className={iconBtn}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-gray-100 truncate">{dayLabel(date)}</p>
              <p className="text-xs text-slate-400 dark:text-gray-500">{date === today ? 'Today' : date}</p>
            </div>
            <button aria-label="Next day" disabled={isToday} onClick={() => onDateChange(shiftDate(date, 1))} className={iconBtn}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-gray-700 px-4 py-3 text-center">
            <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-0.5">Day total</p>
            {!day ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-300 dark:text-gray-500" />
            ) : day.noSpend ? (
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Nothing spent</p>
            ) : totals.length === 0 ? (
              <p className="text-lg font-bold text-slate-400 dark:text-gray-500">Not logged yet</p>
            ) : (
              <p className="text-lg font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                {totals.map(([c, v]) => fmt(v, c)).join(' · ')}
              </p>
            )}
          </div>
          {!isToday && (
            <button onClick={() => onDateChange(today)} className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 cursor-pointer">
              <CalendarDays className="w-3.5 h-3.5" /> Jump to today
            </button>
          )}
        </Card>

        {/* Entry form */}
        <Card>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <div className="grid gap-1.5">
                <label className={labelCls} htmlFor="ledger-amount">Amount</label>
                <input id="ledger-amount" type="number" inputMode="decimal" step="0.01" min="0" value={amount}
                  onChange={e => setAmount(e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
              <div className="grid gap-1.5">
                <label className={labelCls} htmlFor="ledger-currency">Currency</label>
                <select id="ledger-currency" value={currency} onChange={e => setCurrency(e.target.value as Currency)} className={selectCls}>
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className={labelCls} htmlFor="ledger-card">Card</label>
                <select id="ledger-card" value={cardValue} onChange={e => setCard(e.target.value)} className={selectCls}>
                  <option value="">—</option>
                  {cardNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className={labelCls} htmlFor="ledger-category">Category</label>
                <select id="ledger-category" value={categoryValue} onChange={e => setCategory(e.target.value)} className={selectCls}>
                  <option value="">—</option>
                  {categoryNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            {cardNames.length === 0 && categoryNames.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-gray-500">Add your cards and categories in Settings.</p>
            )}
            <div className="grid gap-1.5">
              <label className={labelCls} htmlFor="ledger-note">Note <span className="font-normal text-slate-400 dark:text-gray-500">(optional)</span></label>
              <input id="ledger-note" value={note} maxLength={500} onChange={e => setNote(e.target.value)} placeholder="e.g. lunch" className={inputCls} />
            </div>
            <button type="submit" disabled={!canSave}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-rose-600 disabled:bg-rose-300 dark:disabled:bg-rose-900 disabled:cursor-not-allowed text-white px-4 py-3 font-semibold cursor-pointer active:scale-[0.98] transition-all duration-150">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Add expense
            </button>
          </form>

          {day && day.expenses.length === 0 && (
            <button onClick={toggleNoSpend} disabled={busy}
              className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 px-4 py-2.5 text-sm font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
              {day.noSpend
                ? <><Undo2 className="w-4 h-4" /> Undo “nothing spent”</>
                : <><CircleSlash className="w-4 h-4" /> Nothing spent this day</>}
            </button>
          )}
        </Card>

        {/* Day's entries */}
        {day && day.expenses.length > 0 && (
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Logged</h2>
            <div className="grid divide-y divide-slate-100 dark:divide-gray-700">
              {day.expenses.map(e => (
                <div key={e.id} className="flex items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-gray-100 truncate">
                      {e.category ?? e.title}{e.card && <span className="font-normal text-slate-400 dark:text-gray-500"> · {e.card}</span>}
                    </p>
                    {e.note && <p className="text-xs text-slate-400 dark:text-gray-500 truncate">{e.note}</p>}
                  </div>
                  <span className="text-sm font-semibold text-rose-700 dark:text-rose-400 tabular-nums">{fmt(e.amount, e.currency)}</span>
                  <button aria-label="Delete" onClick={() => remove(e.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-300 dark:text-gray-600 hover:text-red-500 transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <BottomNav onNav={onNav} onCapture={onCapture} onAddManual={onAddManual} />
    </Page>
  )
}
