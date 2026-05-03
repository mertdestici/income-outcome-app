import React, { useRef, useState } from 'react'
import { Wallet, Receipt, Plus, X, Camera, Image as ImageIcon, File, PencilLine } from 'lucide-react'

type CaptureSource = 'scan' | 'photos' | 'files'

export default function BottomNav({ onNav, onCapture, onAddManual }: {
  onNav: (to: string) => void
  onCapture?: (file: globalThis.File, source: CaptureSource) => void
  onAddManual?: () => void
}) {
  const [open, setOpen] = useState(false)
  const scanRef   = useRef<HTMLInputElement>(null)
  const photosRef = useRef<HTMLInputElement>(null)
  const filesRef  = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, source: CaptureSource) => {
    const file = e.target.files?.[0]
    if (file && onCapture) onCapture(file, source)
    e.target.value = ''
    setOpen(false)
  }

  const menuItems = [
    { icon: Camera,      label: 'Scan document',      ref: scanRef,   onClick: () => scanRef.current?.click() },
    { icon: ImageIcon,   label: 'From photos',         ref: photosRef, onClick: () => photosRef.current?.click() },
    { icon: File,        label: 'From files',          ref: filesRef,  onClick: () => filesRef.current?.click() },
    { icon: PencilLine,  label: 'Manual entry',        ref: null,      onClick: () => { setOpen(false); onAddManual?.() } },
  ]

  return (
    <>
      <input ref={scanRef}   type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e, 'scan')} />
      <input ref={photosRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'photos')} />
      <input ref={filesRef}  type="file" className="hidden" onChange={e => handleFile(e, 'files')} />

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[92%] max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-slate-200/80 dark:ring-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-slate-900 dark:text-gray-100">Add Expense</span>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {menuItems.map(({ icon: Icon, label, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-700 active:bg-slate-200 dark:active:bg-gray-600 px-3 py-3 transition-colors cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-gray-300 leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-30">
        <div className="mx-auto max-w-md px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="relative bg-white dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 shadow-[0_-2px_16px_rgba(0,0,0,0.06)] rounded-t-2xl h-16 flex items-center justify-between px-8">
            <button
              onClick={() => onNav('incomes')}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
              aria-label="Incomes"
            >
              <Wallet className="w-5 h-5 text-slate-400 dark:text-gray-500 group-hover:text-indigo-600 transition-colors" />
              <span className="text-[11px] font-medium text-slate-400 dark:text-gray-500 group-hover:text-indigo-600 transition-colors">Income</span>
            </button>

            <button
              onClick={() => setOpen(v => !v)}
              className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-b from-indigo-500 to-indigo-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-indigo-300/60 active:scale-95 transition-transform cursor-pointer"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Add Expense"
            >
              <Plus className={`w-6 h-6 transition-transform duration-200 ${open ? 'rotate-45' : ''}`} />
            </button>

            <button
              onClick={() => onNav('expenses')}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
              aria-label="Expenses"
            >
              <Receipt className="w-5 h-5 text-slate-400 dark:text-gray-500 group-hover:text-indigo-600 transition-colors" />
              <span className="text-[11px] font-medium text-slate-400 dark:text-gray-500 group-hover:text-indigo-600 transition-colors">Expenses</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
