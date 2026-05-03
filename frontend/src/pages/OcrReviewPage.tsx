import React, { useState } from 'react'
import { X, ScanLine } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import type { Currency, DocumentType, OcrStatusResponse } from '../types/income'
import type { CreateExpensePayload } from '../services/expense'

const inputCls = "block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
const selectCls = "block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors cursor-pointer"
const labelCls = "text-sm font-medium text-slate-700"

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function OcrReviewPage({ ocrResult, documentId, documentType, onSave, onCancel }: {
  ocrResult: OcrStatusResponse
  documentId: string
  documentType: DocumentType
  onSave: (payload: CreateExpensePayload) => void
  onCancel: () => void
}) {
  const [vendor,   setVendor]   = useState(ocrResult.vendor ?? '')
  const [date,     setDate]     = useState(ocrResult.date   ?? todayStr())
  const [amount,   setAmount]   = useState(ocrResult.amount != null ? String(ocrResult.amount) : '')
  const [currency, setCurrency] = useState<Currency>('TRY')
  const [docType,  setDocType]  = useState<DocumentType>(documentType)

  const amountNum = Number(amount)
  const canSave   = vendor.trim().length > 0 && amountNum > 0 && isFinite(amountNum)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    onSave({ title: vendor.trim(), amount: amountNum, currency, date, documentType: docType, documentId })
  }

  return (
    <Page
      title="Review Document"
      left={
        <button aria-label="Cancel" onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors">
          <X className="w-4 h-4" />
        </button>
      }
      right={<span />}
    >
      <div className="grid gap-4">
        <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 ring-1 ring-indigo-200/60 px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <ScanLine className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-sm text-indigo-700">
            We extracted the details below from your document. Review and correct if needed.
          </p>
        </div>

        <Card>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-1.5">
              <label className={labelCls} htmlFor="ocr-vendor">Vendor / Merchant</label>
              <input id="ocr-vendor" value={vendor} onChange={e => setVendor(e.target.value)} placeholder="e.g. Migros"
                className={inputCls} />
            </div>

            <div className="grid gap-1.5">
              <label className={labelCls} htmlFor="ocr-date">Date</label>
              <input id="ocr-date" type="date" value={date} onChange={e => setDate(e.target.value)}
                className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className={labelCls} htmlFor="ocr-amount">Amount</label>
                <input id="ocr-amount" type="number" inputMode="decimal" step="0.01" min="0" value={amount}
                  onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className={inputCls} />
              </div>
              <div className="grid gap-1.5">
                <label className={labelCls} htmlFor="ocr-currency">Currency</label>
                <select id="ocr-currency" value={currency} onChange={e => setCurrency(e.target.value as Currency)}
                  className={selectCls}>
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className={labelCls} htmlFor="ocr-doctype">Document Type</label>
              <select id="ocr-doctype" value={docType} onChange={e => setDocType(e.target.value as DocumentType)}
                className={selectCls}>
                <option value="Receipt">Receipt</option>
                <option value="Invoice">Invoice</option>
              </select>
            </div>

            {!canSave && (vendor.trim().length === 0 && amount.length > 0) && (
              <p className="text-xs text-red-500">Enter a vendor name and an amount greater than 0.</p>
            )}

            <button type="submit" disabled={!canSave}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white px-4 py-3 font-semibold cursor-pointer active:scale-[0.98] transition-all duration-150 mt-1">
              Save Expense
            </button>
          </form>
        </Card>
      </div>
    </Page>
  )
}
