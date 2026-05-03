import React from 'react'

export default function RatePill({ label, value }: { label: string; value: number }) {
  const formatted = value <= 0 ? '—' : value >= 10 ? value.toFixed(2) : value.toFixed(4)
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-slate-50 dark:bg-gray-700 ring-1 ring-slate-200/70 dark:ring-gray-600 px-2 py-2.5 text-center">
      <span className="text-[10px] font-semibold text-slate-400 dark:text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-gray-100 tabular-nums text-sm">{formatted}</span>
    </div>
  )
}
