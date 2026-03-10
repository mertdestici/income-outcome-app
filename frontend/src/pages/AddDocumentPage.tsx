import React, { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import type { DocumentType } from '../types/income'
import { documentService } from '../services/document'

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
        <button aria-label="Cancel" onClick={onCancel} className="p-1 rounded hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      }
      right={<span />}
    >
      <Card>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3">
          <div className="grid gap-1">
            <label className="text-sm text-gray-600" htmlFor="doc-name">Document Name</label>
            <input
              id="doc-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Electric bill"
              className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-gray-600" htmlFor="doc-type">Document Type</label>
            <select
              id="doc-type"
              value={documentType}
              onChange={e => setDocumentType(e.target.value as DocumentType)}
              className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Receipt">Receipt</option>
              <option value="Invoice">Invoice</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={!canSave}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600
                       disabled:bg-indigo-300 text-white px-4 py-2 font-medium active:scale-95"
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? 'Uploading…' : 'Save Document'}
          </button>
          {!name.trim() && !uploading && (
            <p className="text-xs text-red-600">Enter a document name.</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      </Card>
    </Page>
  )
}
