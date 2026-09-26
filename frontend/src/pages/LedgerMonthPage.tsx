import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ClipboardCopy, Download, Home, Loader2, PencilLine } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import BottomNav from '../components/BottomNav'
import type { Currency, LedgerMonth, LedgerTotalRow } from '../types/income'
import { ledgerService } from '../services/ledger'

const iconBtn = "p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
const thCls   = "py-2 px-1 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500"
const tdCls   = "py-2 px-1 text-sm text-slate-700 dark:text-gray-300"
const MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December']

function fmt(value: number, c: string): string {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c as any }).format(value) }
  catch { return `${value.toFixed(2)} ${c}` }
}

const money = (v: number) => v.toFixed(2)

// ── Exports ──────────────────────────────────────────────────────────────────

function mdCell(s: string | null | undefined): string {
  return (s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function toMarkdown(m: LedgerMonth): string {
  const totalsTable = (title: string, col: string, rows: LedgerTotalRow[]) => [
    `### ${title}`, '',
    `| ${col} | Count | Total | Currency | Share |`,
    '| --- | ---: | ---: | --- | ---: |',
    ...rows.map(r => `| ${mdCell(r.label)} | ${r.count} | ${money(r.total)} | ${r.currency} | ${r.sharePercent}% |`),
    '',
  ]
  return [
    `## ${MONTHS[m.month - 1]} ${m.year} expenses`, '',
    ...totalsTable('By card', 'Card', m.byCard),
    ...totalsTable('By category', 'Category', m.byCategory),
    '### Every expense', '',
    '| Date | Card | Category | Amount | Currency | Note |',
    '| --- | --- | --- | ---: | --- | --- |',
    ...m.expenses.map(e => `| ${e.date} | ${mdCell(e.card)} | ${mdCell(e.category)} | ${money(e.amount)} | ${e.currency} | ${mdCell(e.note)} |`),
    '',
    m.missingDays.length ? `Days with no entry: ${m.missingDays.join(', ')}` : 'Every day is logged.',
  ].join('\n')
}

function csvCell(s: string | number | null | undefined): string {
  const v = String(s ?? '')
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

function toCsv(m: LedgerMonth): string {
  const rows = [
    ['date', 'title', 'card', 'category', 'amount', 'currency', 'note'],
    ...m.expenses.map(e => [e.date, e.title, e.card, e.category, money(e.amount), e.currency, e.note]),
  ]
  return rows.map(r => r.map(csvCell).join(',')).join('\n') + '\n'
}

// ── Page ─────────────────────────────────────────────────────────────────────

function TotalsTable({ title, col, rows }: { title: string; col: string; rows: LedgerTotalRow[] }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">{title}</h2>
      <table className="w-full">
        <thead className="border-b border-slate-100 dark:border-gray-700">
          <tr><th className={thCls}>{col}</th><th className={`${thCls} text-right`}>Total</th><th className={`${thCls} text-right`}>Share</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.label + r.currency}>
              <td className={tdCls}>{r.label} <span className="text-xs text-slate-400 dark:text-gray-500">×{r.count}</span></td>
              <td className={`${tdCls} text-right tabular-nums font-semibold`}>{fmt(r.total, r.currency)}</td>
              <td className={`${tdCls} text-right tabular-nums w-20`}>
                <div className="flex items-center justify-end gap-1.5">
                  <div className="w-8 h-1.5 rounded-full bg-slate-100 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, r.sharePercent)}%` }} />
                  </div>
                  {r.sharePercent}%
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export default function LedgerMonthPage({ year, month, onMonthChange, onOpenDay, onHome, onNav, onCapture, onAddManual, onToast }: {
  year: number
  month: number   // 1–12
  onMonthChange: (year: number, month: number) => void
  onOpenDay: (date: string) => void
  onHome: () => void
  onNav: (to: string) => void
  onCapture: (file: File, source: 'scan' | 'photos' | 'files') => void
  onAddManual: () => void
  onToast: (message: string, type: 'info' | 'error') => void
}) {
  const [data, setData] = useState<LedgerMonth | null>(null)

  useEffect(() => {
    setData(null)
    ledgerService.month(year, month).then(setData).catch(() => onToast('Failed to load month', 'error'))
  }, [year, month])

  const now       = new Date()
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1
  const step = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1)
    onMonthChange(d.getFullYear(), d.getMonth() + 1)
  }

  const copy = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(toMarkdown(data))
      onToast('Table copied as markdown', 'info')
    } catch {
      onToast('Clipboard not available', 'error')
    }
  }

  const download = () => {
    if (!data) return
    const url = URL.createObjectURL(new Blob([toCsv(data)], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${year}-${String(month).padStart(2, '0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totals = Object.entries(data?.totals ?? {}) as [Currency, number][]

  return (
    <Page
      title="Month Table"
      left={<button aria-label="Home" onClick={onHome} className={iconBtn}><Home className="w-4 h-4" /></button>}
      right={<button aria-label="Daily log" onClick={() => onNav('ledger')} className={iconBtn}><PencilLine className="w-4 h-4" /></button>}
    >
      <div className="grid gap-4">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <button aria-label="Previous month" onClick={() => step(-1)} className={iconBtn}><ChevronLeft className="w-5 h-5" /></button>
            <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">{MONTHS[month - 1]} {year}</p>
            <button aria-label="Next month" disabled={isCurrent} onClick={() => step(1)} className={iconBtn}><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-gray-700 px-4 py-3 text-center">
            <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-0.5">Month total</p>
            {!data
              ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-300 dark:text-gray-500" />
              : <p className="text-lg font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                  {totals.length ? totals.map(([c, v]) => fmt(v, c)).join(' · ') : '—'}
                </p>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={copy} disabled={!data}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <ClipboardCopy className="w-4 h-4" /> Copy table
            </button>
            <button onClick={download} disabled={!data}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <Download className="w-4 h-4" /> Download CSV
            </button>
          </div>
        </Card>

        {data && data.expenses.length > 0 && (
          <>
            <TotalsTable title="By card" col="Card" rows={data.byCard} />
            <TotalsTable title="By category" col="Category" rows={data.byCategory} />
            <Card>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Every expense</h2>
              <div className="grid divide-y divide-slate-100 dark:divide-gray-700">
                {data.expenses.map(e => (
                  <button key={e.id} onClick={() => onOpenDay(e.date)} className="flex items-center gap-2 py-2 text-left cursor-pointer">
                    <span className="text-xs text-slate-400 dark:text-gray-500 tabular-nums w-10 shrink-0">{e.date.slice(8)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900 dark:text-gray-100 truncate">
                        {e.category ?? e.title}{e.card && <span className="text-slate-400 dark:text-gray-500"> · {e.card}</span>}
                      </p>
                      {e.note && <p className="text-xs text-slate-400 dark:text-gray-500 truncate">{e.note}</p>}
                    </div>
                    <span className="text-sm font-semibold text-rose-700 dark:text-rose-400 tabular-nums">{fmt(e.amount, e.currency)}</span>
                  </button>
                ))}
              </div>
            </Card>
          </>
        )}

        {data && data.expenses.length === 0 && (
          <Card><p className="text-sm text-center text-slate-500 dark:text-gray-400 py-4">No expenses logged this month.</p></Card>
        )}

        {data && data.missingDays.length > 0 && (
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-300">Days with no entry</h2>
            <p className="text-xs text-slate-400 dark:text-gray-500 mb-3">Tap a day to fill it in.</p>
            <div className="flex flex-wrap gap-1.5">
              {data.missingDays.map(d => (
                <button key={d} onClick={() => onOpenDay(d)}
                  className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold tabular-nums hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer transition-colors">
                  {Number(d.slice(8))}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      <BottomNav onNav={onNav} onCapture={onCapture} onAddManual={onAddManual} />
    </Page>
  )
}
