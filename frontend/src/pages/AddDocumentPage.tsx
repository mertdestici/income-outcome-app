import React, { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import type { DocumentType } from '../types/income'
import { documentService } from '../services/document'

const inputCls = "block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
const selectCls = "block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors cursor-pointer"
const labelCls = "text-sm font-medium text-slate-700"

export default function AddDocumentPage({ defaultName, capturedFile, onUploaded, onCancel }: {
  defaultName: string
  capturedFile: File
  onUploaded: (documentId: string, documentType: DocumentType) => void
  onCancel: () => void
}) {
  const [name,         setName]         = useState(defaultName)
  const [documentType, setDocumentType] = useState<DocumentType>('Receipt')
  const [uploading,    setUploading]    = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const canSave = name.trim().length > 0 && !uploading

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    setUploading(true)
    setError(null)
    try {
      const doc = await documentService.uploadForOcr(capturedFile)
      onUploaded(doc.id, documentType)
    } catch (err: any) {
      setError(err.message ?? 'Upload failed. Please try again.')
      setUploading(false)
    }
  }

  return (
    <Page
      title="Add Document"
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
            <label className={labelCls} htmlFor="doc-name">Document Name</label>
            <input id="doc-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Electric bill"
              className={inputCls} />
          </div>
          <div className="grid gap-1.5">
            <label className={labelCls} htmlFor="doc-type">Document Type</label>
            <select id="doc-type" value={documentType} onChange={e => setDocumentType(e.target.value as DocumentType)}
              className={selectCls}>
              <option value="Receipt">Receipt</option>
              <option value="Invoice">Invoice</option>
            </select>
          </div>

          {!name.trim() && !uploading && (
            <p className="text-xs text-red-500">Enter a document name.</p>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={!canSave}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white px-4 py-3 font-semibold cursor-pointer active:scale-[0.98] transition-all duration-150 mt-1">
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? 'Uploading…' : 'Save Document'}
          </button>
        </form>
      </Card>
    </Page>
  )
}
