import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'

type ThemeContextValue = {
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
  resolved: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  setPreference: () => {},
  resolved: 'light',
})

const STORAGE_KEY = 'theme_preference'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
    return 'system'
  })

  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const resolved: 'light' | 'dark' =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    const root = document.documentElement
    if (resolved === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [resolved])

  function setPreference(p: ThemePreference) {
    setPreferenceState(p)
    localStorage.setItem(STORAGE_KEY, p)
  }

  return (
    <ThemeContext.Provider value={{ preference, setPreference, resolved }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
