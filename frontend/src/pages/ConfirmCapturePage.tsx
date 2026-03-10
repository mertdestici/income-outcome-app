import React from 'react'
import { File as FileIcon } from 'lucide-react'
import Page from '../components/Page'

type CaptureSource = 'scan' | 'photos' | 'files'

export default function ConfirmCapturePage({ dataUrl, fileName, source, onConfirm, onCancel }: {
  dataUrl: string
  fileName: string
  source: CaptureSource
  onConfirm: () => void
  onCancel: () => void
}) {
  const isImage = dataUrl.startsWith('data:image/')

  return (
    <Page title="Preview" left={<span />} right={<span />}>
      <div className="flex flex-col items-center gap-6">
        {isImage ? (
          <img src={dataUrl} alt={fileName} className="w-full max-h-[60vh] object-contain rounded-2xl border border-gray-200" />
        ) : (
          <div className="flex flex-col items-center gap-2 py-12">
            <FileIcon className="w-16 h-16 text-gray-400" />
            <div className="text-sm text-gray-600 break-all text-center px-4">{fileName}</div>
          </div>
        )}

        <div className="flex gap-4 w-full">
          <button onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-medium active:scale-95 hover:bg-gray-50">
            {source === 'scan' ? 'Retake' : 'Cancel'}
          </button>
          <button onClick={onConfirm}
            className="flex-1 rounded-xl bg-indigo-600 text-white px-4 py-3 font-medium active:scale-95">
            Done
          </button>
        </div>
      </div>
    </Page>
  )
}
