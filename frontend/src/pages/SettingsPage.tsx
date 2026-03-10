import React, { useEffect, useState } from 'react'
import { Home, Loader2, Save } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import { getSettings, updateSettings } from '../services/settings'

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
        <button aria-label="Home" onClick={onHome} className="p-1 rounded hover:bg-gray-100">
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
        <Card>
          <form onSubmit={handleSave} className="grid gap-4">
            <div className="grid gap-1">
              <label htmlFor="report-email" className="text-sm font-medium text-gray-700">
                Monthly Report Email
              </label>
              <input
                id="report-email"
                type="email"
                value={reportEmail}
                onChange={e => setReportEmail(e.target.value)}
                placeholder="e.g. accountant@example.com"
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400">
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
      )}
    </Page>
  )
}
