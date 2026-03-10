import React, { useRef, useState } from 'react'
import { Wallet, Receipt, Plus, X, Camera, Image as ImageIcon, File, PencilLine } from 'lucide-react'

type CaptureSource = 'scan' | 'photos' | 'files'

export default function BottomNav({ onNav, onCapture, onAddManual }: {
  onNav: (to: string) => void
  onCapture?: (file: globalThis.File, source: CaptureSource) => void
  onAddManual?: () => void
}) {
  const [open, setOpen] = useState(false)
  const scanRef = useRef<HTMLInputElement>(null)
  const photosRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, source: CaptureSource) => {
    const file = e.target.files?.[0]
    if (file && onCapture) onCapture(file, source)
    e.target.value = ''
    setOpen(false)
  }

  return (
    <>
      <input ref={scanRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e, 'scan')} />
      <input ref={photosRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'photos')} />
      <input ref={filesRef} type="file" className="hidden" onChange={e => handleFile(e, 'files')} />

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[92%] max-w-md" onClick={e => e.stopPropagation()}>
            <div className="rounded-2xl bg-white shadow-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">Add Expense</div>
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100" aria-label="Close"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button onClick={() => scanRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-gray-200 hover:bg-gray-50 px-3 py-2">
                  <Camera className="w-4 h-4" /><span>Scan document</span>
                </button>
                <button onClick={() => photosRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-gray-200 hover:bg-gray-50 px-3 py-2">
                  <ImageIcon className="w-4 h-4" /><span>Add From Photos</span>
                </button>
                <button onClick={() => filesRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-gray-200 hover:bg-gray-50 px-3 py-2">
                  <File className="w-4 h-4" /><span>Add from files</span>
                </button>
                <button onClick={() => { setOpen(false); onAddManual?.() }} className="flex items-center gap-2 rounded-xl border border-gray-200 hover:bg-gray-50 px-3 py-2">
                  <PencilLine className="w-4 h-4" /><span>Add Manual Expense</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-30">
        <div className="mx-auto max-w-md px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="relative bg-white border-t border-gray-200 shadow-lg rounded-t-2xl h-16 flex items-center justify-between px-6">
            <button onClick={() => onNav('incomes')} className="flex flex-col items-center text-xs hover:text-gray-900" aria-label="Incomes">
              <Wallet className="w-5 h-5" />
              Incomes
            </button>
            <button
              onClick={() => setOpen(v => !v)}
              className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl active:scale-95"
              aria-haspopup="menu" aria-expanded={open} aria-label="Add Expense">
              <Plus className="w-6 h-6" />
            </button>
            <button onClick={() => onNav('expenses')} className="flex flex-col items-center text-xs hover:text-gray-900" aria-label="Expenses">
              <Receipt className="w-5 h-5" />
              Expenses
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
