import { useEffect, useState } from 'react'
import { fetchRates, type PairRates } from './rates'

type State = { loading: boolean; error: string | null; data: PairRates | null }

export function useLiveRates(intervalMs = 30_000) {
  const [state, setState] = useState<State>({ loading: true, error: null, data: null })
  useEffect(() => {
    let mounted = true
    const tick = async () => {
      try {
        const d = await fetchRates()
        if (mounted) setState({ loading: false, error: null, data: d })
      } catch (e: any) {
        if (mounted) setState(s => ({ ...s, loading: false, error: e?.message || 'Fetch error' }))
      }
    }
    tick()
    const id = setInterval(tick, intervalMs)
    return () => { mounted = false; clearInterval(id) }
  }, [intervalMs])
  return state
}
