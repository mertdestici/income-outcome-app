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
      <div className="flex flex-col items-center gap-5">
        {isImage ? (
          <img
            src={dataUrl}
            alt={fileName}
            className="w-full max-h-[60vh] object-contain rounded-2xl ring-1 ring-slate-200/80 shadow-sm"
          />
        ) : (
          <div className="w-full flex flex-col items-center gap-3 py-14 rounded-2xl bg-white ring-1 ring-slate-200/80">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <FileIcon className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 break-all text-center px-6 font-medium">{fileName}</p>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 cursor-pointer active:scale-[0.98] hover:bg-slate-50 transition-all duration-150"
          >
            {source === 'scan' ? 'Retake' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-indigo-600 text-white px-4 py-3 font-semibold cursor-pointer active:scale-[0.98] transition-all duration-150 shadow-sm shadow-indigo-100"
          >
            Continue
          </button>
        </div>
      </div>
    </Page>
  )
}
