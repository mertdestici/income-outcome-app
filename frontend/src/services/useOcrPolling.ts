import { useEffect, useRef } from 'react'
import { documentService } from './document'
import type { OcrStatusResponse } from '../types/income'

const PLACEHOLDER_DELAY_MS = 200   // show placeholder row after this many ms
const SLOW_PATH_MS         = 3000  // hide placeholder after this; switch to toast-on-finish
const POLL_INTERVAL_MS     = 500

interface OcrPollingCallbacks {
  onShowPlaceholder: () => void
  onHidePlaceholder: () => void
  onSlowPath:        () => void   // called when 3 s elapses without completion
  onDone:            (result: OcrStatusResponse) => void
  onFailed:          () => void
}

/**
 * Polls OCR status for `documentId`. Starts when documentId becomes non-null,
 * stops (and cleans up) when it becomes null again or the component unmounts.
 */
export function useOcrPolling(
  documentId: string | null,
  callbacks: OcrPollingCallbacks,
) {
  // Keep callbacks in a ref so the interval closure always sees the latest values
  const cbRef = useRef(callbacks)
  cbRef.current = callbacks

  useEffect(() => {
    if (!documentId) return

    let placeholderShown = false
    let slowPathReached  = false

    const placeholderTimer = setTimeout(() => {
      placeholderShown = true
      cbRef.current.onShowPlaceholder()
    }, PLACEHOLDER_DELAY_MS)

    const slowPathTimer = setTimeout(() => {
      slowPathReached = true
      if (placeholderShown) {
        cbRef.current.onHidePlaceholder()
        placeholderShown = false
      }
      cbRef.current.onSlowPath()
    }, SLOW_PATH_MS)

    const interval = setInterval(async () => {
      try {
        const status = await documentService.getOcrStatus(documentId)
        if (status.status !== 'DONE' && status.status !== 'FAILED') return

        clearInterval(interval)
        clearTimeout(placeholderTimer)
        clearTimeout(slowPathTimer)

        if (placeholderShown) cbRef.current.onHidePlaceholder()

        if (status.status === 'DONE') {
          cbRef.current.onDone(status)
        } else {
          cbRef.current.onFailed()
        }
      } catch {
        // network error — keep polling
      }
    }, POLL_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(placeholderTimer)
      clearTimeout(slowPathTimer)
      if (placeholderShown) cbRef.current.onHidePlaceholder()
    }
  }, [documentId])
}
