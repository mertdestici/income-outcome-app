import React, { useEffect, useState } from 'react'
import { Home, Loader2, Save, Mail } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import { getSettings, updateSettings } from '../services/settings'

const inputCls = "block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"

export default function SettingsPage({ onHome, onToast }: {
  onHome: () => void
  onToast: (message: string, type: 'info' | 'error') => void
}) {
  const [reportEmail, setReportEmail] = useState('')
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)

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
        <button aria-label="Home" onClick={onHome} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors">
          <Home className="w-4 h-4" />
        </button>
      }
      right={<span />}
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      ) : (
        <Card>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Monthly Report</p>
              <p className="text-xs text-slate-400">Sent on the 20th of each month</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="grid gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="report-email" className="text-sm font-medium text-slate-700">
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
              <p className="text-xs text-slate-400 leading-relaxed">
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
      )}
    </Page>
  )
}
