import React, { useEffect, useState } from 'react'
import { Home, Loader2, Save, Mail, Monitor, Moon, Sun } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import { getSettings, updateSettings } from '../services/settings'
import { useTheme, type ThemePreference } from '../context/ThemeContext'

const inputCls = "block w-full rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"

const themeOptions: { value: ThemePreference; label: string; Icon: React.ElementType }[] = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light',  label: 'Light',  Icon: Sun },
  { value: 'dark',   label: 'Dark',   Icon: Moon },
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
        <button aria-label="Home" onClick={onHome} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 cursor-pointer transition-colors">
          <Home className="w-4 h-4" />
        </button>
      }
      right={<span />}
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300 dark:text-gray-600" />
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Appearance Card */}
          <Card>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">Appearance</p>
                <p className="text-xs text-slate-400 dark:text-gray-500">Choose your preferred theme</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, label, Icon }) => {
                const isActive = preference === value
                return (
                  <button
                    key={value}
                    onClick={() => setPreference(value)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Report Email Card */}
          <Card>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">Monthly Report</p>
                <p className="text-xs text-slate-400 dark:text-gray-500">Sent on the 20th of each month</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="grid gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="report-email" className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  Report Email
                </label>
                <input
                  id="report-email"
                  type="email"
                  value={reportEmail}
                  onChange={e => setReportEmail(e.target.value)}
                  placeholder="e.g. accountant@example.com"
                  className={inputCls}
                />
                <p className="text-xs text-slate-400 dark:text-gray-500 leading-relaxed">
                  Your expense documents are compiled into a PDF and sent to this address. Leave empty to disable.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white px-4 py-3 font-semibold cursor-pointer active:scale-[0.98] transition-all duration-150 mt-1"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </form>
          </Card>
        </div>
      )}
    </Page>
  )
}
