import React, { useEffect, useState } from 'react'
import { Home, Loader2, Save, Mail, Monitor, Moon, Sun, Bell, CreditCard, Plus, X } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import { getSettings, updateSettings } from '../services/settings'
import { ledgerService } from '../services/ledger'
import type { LedgerOptionKind, LedgerOptions } from '../types/income'
import { useTheme, type ThemePreference } from '../context/ThemeContext'

const inputCls = "block w-full rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"

const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const timezones: string[] = (Intl as any).supportedValuesOf?.('timeZone') ?? [deviceTimezone]

function Toggle({ checked, onChange, label, hint }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; hint: string
}) {
  return (
    <label className="flex items-start justify-between gap-3 cursor-pointer">
      <span>
        <span className="block text-sm font-medium text-slate-700 dark:text-gray-300">{label}</span>
        <span className="block text-xs text-slate-400 dark:text-gray-500">{hint}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-1 w-5 h-5 accent-indigo-600 cursor-pointer shrink-0" />
    </label>
  )
}

function OptionList({ title, kind, options, onAdd, onDelete }: {
  title: string
  kind: LedgerOptionKind
  options: { id: string; name: string }[]
  onAdd: (kind: LedgerOptionKind, name: string) => Promise<boolean>
  onDelete: (id: string) => void
}) {
  const [name, setName] = useState('')
  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && await onAdd(kind, name.trim())) setName('')
  }
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-slate-700 dark:text-gray-300">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.length === 0 && <span className="text-xs text-slate-400 dark:text-gray-500">None yet</span>}
        {options.map(o => (
          <span key={o.id} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-gray-700 pl-2.5 pr-1 py-1 text-sm text-slate-700 dark:text-gray-300">
            {o.name}
            <button aria-label={`Remove ${o.name}`} onClick={() => onDelete(o.id)}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-400 hover:text-red-500 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={add} className="flex gap-2">
        <input value={name} maxLength={50} onChange={e => setName(e.target.value)}
          placeholder={kind === 'CARD' ? 'e.g. Visa ••1234' : 'e.g. Groceries'} className={inputCls} />
        <button type="submit" aria-label={`Add ${kind === 'CARD' ? 'card' : 'category'}`} disabled={!name.trim()}
          className="shrink-0 px-3 rounded-xl bg-indigo-600 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 text-white cursor-pointer disabled:cursor-not-allowed">
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

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
  const [savedReportEmail, setSavedReportEmail] = useState<string | null>(null)
  const [timezone,    setTimezone]    = useState(deviceTimezone)
  const [dailyReminder,  setDailyReminder]  = useState(false)
  const [monthlyLedger,  setMonthlyLedger]  = useState(false)
  const [options,     setOptions]     = useState<LedgerOptions>({ cards: [], categories: [] })
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const { preference, setPreference } = useTheme()

  useEffect(() => {
    getSettings()
      .then(s => {
        setReportEmail(s.reportEmail ?? '')
        setSavedReportEmail(s.reportEmail)
        setTimezone(s.timezone)
        setDailyReminder(s.dailyReminderEnabled)
        setMonthlyLedger(s.monthlyLedgerEnabled)
      })
      .catch(() => onToast('Failed to load settings', 'error'))
      .finally(() => setLoading(false))
    ledgerService.options().then(setOptions).catch(() => {})
  }, [])

  // Reminder controls save immediately; the report email keeps its own Save button
  async function saveReminders(patch: { timezone?: string; dailyReminderEnabled?: boolean; monthlyLedgerEnabled?: boolean }) {
    const next = {
      reportEmail:          savedReportEmail,
      timezone:             patch.timezone ?? timezone,
      dailyReminderEnabled: patch.dailyReminderEnabled ?? dailyReminder,
      monthlyLedgerEnabled: patch.monthlyLedgerEnabled ?? monthlyLedger,
    }
    setTimezone(next.timezone)
    setDailyReminder(next.dailyReminderEnabled)
    setMonthlyLedger(next.monthlyLedgerEnabled)
    try {
      await updateSettings(next)
    } catch {
      onToast('Failed to save reminder settings', 'error')
      setTimezone(timezone)
      setDailyReminder(dailyReminder)
      setMonthlyLedger(monthlyLedger)
    }
  }

  async function addOption(kind: LedgerOptionKind, name: string): Promise<boolean> {
    try {
      const created = await ledgerService.addOption(kind, name)
      const key = kind === 'CARD' ? 'cards' : 'categories'
      setOptions(prev => ({ ...prev, [key]: [...prev[key], created].sort((a, b) => a.name.localeCompare(b.name)) }))
      return true
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to add', 'error')
      return false
    }
  }

  async function deleteOption(id: string) {
    try {
      await ledgerService.deleteOption(id)
      setOptions(prev => ({
        cards:      prev.cards.filter(o => o.id !== id),
        categories: prev.categories.filter(o => o.id !== id),
      }))
    } catch {
      onToast('Failed to remove', 'error')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const saved = await updateSettings({
        reportEmail:          reportEmail.trim() || null,
        timezone,
        dailyReminderEnabled: dailyReminder,
        monthlyLedgerEnabled: monthlyLedger,
      })
      setSavedReportEmail(saved.reportEmail)
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

          {/* Cards & Categories */}
          <Card>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">Cards &amp; Categories</p>
                <p className="text-xs text-slate-400 dark:text-gray-500">Choices in the Daily Log. Removing one keeps past expenses as they are.</p>
              </div>
            </div>
            <div className="grid gap-5">
              <OptionList title="Cards" kind="CARD" options={options.cards} onAdd={addOption} onDelete={deleteOption} />
              <OptionList title="Categories" kind="CATEGORY" options={options.categories} onAdd={addOption} onDelete={deleteOption} />
            </div>
          </Card>

          {/* Reminders */}
          <Card>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">Reminders</p>
                <p className="text-xs text-slate-400 dark:text-gray-500">Emailed to your account address</p>
              </div>
            </div>
            <div className="grid gap-4">
              <Toggle checked={dailyReminder} onChange={v => saveReminders({ dailyReminderEnabled: v })}
                label="Daily log reminder" hint="8:00 pm, only if nothing is logged for that day" />
              <Toggle checked={monthlyLedger} onChange={v => saveReminders({ monthlyLedgerEnabled: v })}
                label="Monthly expense table" hint="9:00 am on the 1st — last month by card and category" />
              <div className="grid gap-1.5">
                <label htmlFor="timezone" className="text-sm font-medium text-slate-700 dark:text-gray-300">Timezone</label>
                <select id="timezone" value={timezone} onChange={e => saveReminders({ timezone: e.target.value })} className={inputCls + ' cursor-pointer'}>
                  {(timezones.includes(timezone) ? timezones : [timezone, ...timezones]).map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
                {timezone !== deviceTimezone && (
                  <button type="button" onClick={() => saveReminders({ timezone: deviceTimezone })}
                    className="justify-self-start text-xs font-medium text-indigo-600 dark:text-indigo-400 cursor-pointer">
                    Use this device's timezone ({deviceTimezone})
                  </button>
                )}
              </div>
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
