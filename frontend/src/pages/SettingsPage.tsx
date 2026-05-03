import React, { useEffect, useState } from 'react'
import { Home, Loader2, Monitor, Moon, Save, Sun } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import { getSettings, updateSettings } from '../services/settings'
import { useTheme, type ThemePreference } from '../context/ThemeContext'

const inputCls = "rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

const THEME_OPTIONS: { value: ThemePreference; label: string; Icon: React.ElementType }[] = [
  { value: 'system', label: 'System',  Icon: Monitor },
  { value: 'light',  label: 'Light',   Icon: Sun     },
  { value: 'dark',   label: 'Dark',    Icon: Moon    },
]

export default function SettingsPage({ onHome, onToast }: {
  onHome: () => void
  onToast: (message: string, type: 'info' | 'error') => void
}) {
  const [reportEmail, setReportEmail] = useState('')
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const { preference, setPreference } = useTheme()

  useEffect(() => {
    getSettings()
      .then(s => setReportEmail(s.reportEmail ?? ''))
      .catch(() => onToast('Failed to load settings', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateSettings(reportEmail.trim() || null)
      onToast('Settings saved', 'info')
    } catch {
      onToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page
      title="Settings"
      left={
        <button aria-label="Home" onClick={onHome} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <Home className="w-5 h-5" />
        </button>
      }
      right={<span />}
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-4">
          <Card>
            <h2 className="text-sm font-semibold mb-3">Appearance</h2>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map(({ value, label, Icon }) => {
                const active = preference === value
                return (
                  <button
                    key={value}
                    onClick={() => setPreference(value)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors
                      ${active
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                )
              })}
            </div>
          </Card>

          <Card>
            <form onSubmit={handleSave} className="grid gap-4">
              <div className="grid gap-1">
                <label htmlFor="report-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monthly Report Email
                </label>
                <input
                  id="report-email"
                  type="email"
                  value={reportEmail}
                  onChange={e => setReportEmail(e.target.value)}
                  placeholder="e.g. accountant@example.com"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  On the 20th of each month, your expense documents are compiled into a PDF
                  and emailed to this address. Leave empty to disable.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600
                           disabled:bg-indigo-300 text-white px-4 py-2 font-medium active:scale-95"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </form>
          </Card>
        </div>
      )}
    </Page>
  )
}
