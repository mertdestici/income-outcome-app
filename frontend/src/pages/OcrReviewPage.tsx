import React, { useState } from 'react'
import { X } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import type { Currency, DocumentType, OcrStatusResponse } from '../types/income'
import type { CreateExpensePayload } from '../services/expense'

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
    onSave({
      title:        vendor.trim(),
      amount:       amountNum,
      currency,
      date,
      documentType: docType,
      documentId,
    })
  }

  return (
    <Page
      title="Review Document"
      left={<button aria-label="Cancel" onClick={onCancel} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>}
      right={<span />}
    >
      <Card>
        <p className="text-xs text-gray-500 mb-3">
          We extracted the details below from your document. Review and correct them before saving.
        </p>
        <form onSubmit={submit} className="grid gap-3">

          <div className="grid gap-1">
            <label className="text-sm text-gray-600" htmlFor="ocr-vendor">Vendor / Merchant</label>
            <input
              id="ocr-vendor"
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              placeholder="e.g. Migros"
              className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm text-gray-600" htmlFor="ocr-date">Date</label>
            <input
              id="ocr-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-sm text-gray-600" htmlFor="ocr-amount">Amount</label>
              <input
                id="ocr-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="min-w-0 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-gray-600" htmlFor="ocr-currency">Currency</label>
              <select
                id="ocr-currency"
                value={currency}
                onChange={e => setCurrency(e.target.value as Currency)}
                className="min-w-0 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-sm text-gray-600" htmlFor="ocr-doctype">Document Type</label>
            <select
              id="ocr-doctype"
              value={docType}
              onChange={e => setDocType(e.target.value as DocumentType)}
              className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Receipt">Receipt</option>
              <option value="Invoice">Invoice</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!canSave}
            className="rounded-xl bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 font-medium active:scale-95"
          >
            Save Expense
          </button>
          {!canSave && (
            <p className="text-xs text-red-600">Enter a vendor name and an amount greater than 0.</p>
          )}
        </form>
      </Card>
    </Page>
  )
}
