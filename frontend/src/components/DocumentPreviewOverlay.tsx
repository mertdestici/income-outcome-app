import { useEffect, useState } from 'react'
import { Download, Loader2, X, FileX } from 'lucide-react'
import { documentService } from '../services/document'

export default function DocumentPreviewOverlay({ documentId, onClose }: {
  documentId: string
  onClose: () => void
}) {
  const [blobUrl,      setBlobUrl]      = useState<string | null>(null)
  const [contentType,  setContentType]  = useState('')
  const [fileName,     setFileName]     = useState('')
  const [error,        setError]        = useState(false)

  useEffect(() => {
    let createdUrl = ''
    documentService.getBlobUrl(documentId)
      .then(({ url, contentType: ct, fileName: fn }) => {
        createdUrl = url
        setBlobUrl(url)
        setContentType(ct)
        setFileName(fn)
      })
      .catch(() => setError(true))

    return () => { if (createdUrl) URL.revokeObjectURL(createdUrl) }
  }, [documentId])

  const isImage = contentType.startsWith('image/')
  const isPdf   = contentType === 'application/pdf'

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex flex-col">

      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/10">
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {fileName && (
          <span className="text-sm font-medium text-white/70 truncate max-w-[50%] text-center">{fileName}</span>
        )}

        {blobUrl ? (
          <a
            href={blobUrl}
            download={fileName}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-3 py-2 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </a>
        ) : (
          <div className="w-24" />
        )}
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        {!blobUrl && !error && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
            <p className="text-sm text-white/40">Loading document…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <FileX className="w-7 h-7 text-white/40" />
            </div>
            <p className="text-sm text-white/60">Failed to load document</p>
          </div>
        )}

        {blobUrl && isImage && (
          <img
            src={blobUrl}
            alt="Document preview"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          />
        )}

        {blobUrl && isPdf && (
          <iframe
            src={blobUrl}
            title="Document preview"
            className="w-full h-full rounded-xl border-0"
          />
        )}

        {blobUrl && !isImage && !isPdf && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <Download className="w-7 h-7 text-white/40" />
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Preview not available for this file type.
              <br />
              Use the Download button above.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
