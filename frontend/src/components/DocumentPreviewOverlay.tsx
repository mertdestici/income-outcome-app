import { useEffect, useState } from 'react'
import { Download, Loader2, X } from 'lucide-react'
import { documentService } from '../services/document'

export default function DocumentPreviewOverlay({ documentId, onClose }: {
  documentId: string
  onClose: () => void
}) {
  const [blobUrl,     setBlobUrl]     = useState<string | null>(null)
  const [contentType, setContentType] = useState('')
  const [fileName,    setFileName]    = useState('')
  const [error,       setError]       = useState(false)

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

    return () => {
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [documentId])

  const isImage = contentType.startsWith('image/')
  const isPdf   = contentType === 'application/pdf'

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 shrink-0">
        <button onClick={onClose} aria-label="Close" className="text-white p-1 rounded hover:bg-white/10">
          <X className="w-6 h-6" />
        </button>
        {blobUrl && (
          <a
            href={blobUrl}
            download={fileName}
            className="flex items-center gap-1.5 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        {!blobUrl && !error && (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        )}

        {error && (
          <p className="text-white text-sm text-center">
            Failed to load document.
          </p>
        )}

        {blobUrl && isImage && (
          <img
            src={blobUrl}
            alt="Document preview"
            className="max-w-full max-h-full object-contain rounded"
          />
        )}

        {blobUrl && isPdf && (
          <iframe
            src={blobUrl}
            title="Document preview"
            className="w-full h-full rounded border-0"
          />
        )}

        {blobUrl && !isImage && !isPdf && (
          <p className="text-white text-sm text-center leading-relaxed">
            Preview not available for this file type.
            <br />
            Use the Download button above.
          </p>
        )}
      </div>
    </div>
  )
}
