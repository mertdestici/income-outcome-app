# Phase 15: Settings Page (Frontend)

## Status: Complete

## Overview

Add a **Settings** page to the frontend where users can configure their monthly report recipient email. The page fetches the current value from `GET /api/settings` on load and persists changes via `PUT /api/settings`. A success or error toast confirms the outcome. The page is reachable via a gear icon added to the Home page header.

---

## Existing Files to Modify

### `App.tsx`

Add `'settings'` to the route union and render `SettingsPage`:

```ts
type Route = 'home' | 'incomes' | 'expenses' | 'add-manual-expense'
           | 'confirm-capture' | 'add-document' | 'ocr-review' | 'settings'
```

Add the route case in the render block:

```tsx
{route === 'settings' && (
  <SettingsPage
    onHome={() => setRoute('home')}
    onToast={(msg, type) => showToast(msg, type)}
  />
)}
```

### `pages/HomePage.tsx`

Add a gear icon in the top-right corner of the home page header that navigates to Settings:

```tsx
// Props addition
onSettings: () => void

// In JSX — right side of the Page header
right={
  <button aria-label="Settings" onClick={onSettings} className="p-1 rounded hover:bg-gray-100">
    <Settings className="w-5 h-5" />   {/* lucide-react Settings icon */}
  </button>
}
```

Pass `onSettings={() => setRoute('settings')}` from `App.tsx`.

---

## New Files to Create

### `services/settings.ts`

```ts
import { apiFetch } from './api'

export interface UserSettings {
  reportEmail: string | null
}

export async function getSettings(): Promise<UserSettings> {
  return apiFetch('/api/settings')
}

export async function updateSettings(reportEmail: string | null): Promise<UserSettings> {
  return apiFetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportEmail }),
  })
}
```

### `pages/SettingsPage.tsx`

```tsx
import React, { useEffect, useState } from 'react'
import { Home, Save } from 'lucide-react'
import Page from '../components/Page'
import Card from '../components/Card'
import { getSettings, updateSettings } from '../services/settings'

export default function SettingsPage({ onHome, onToast }: {
  onHome: () => void
  onToast: (message: string, type: 'info' | 'error') => void
}) {
  const [reportEmail, setReportEmail] = useState('')
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)

  // Load current settings on mount
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
        <div className="text-sm text-gray-500 text-center py-8">Loading…</div>
      ) : (
        <Card>
          <form onSubmit={handleSave} className="grid gap-4">

            {/* Report Email */}
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
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>

          </form>
        </Card>
      )}
    </Page>
  )
}
```

---

## Key Design Decisions

- **Empty string → null on save** — an empty input means "disable reports"; `updateSettings` converts `''` to `null` before sending so the backend stores `NULL` in the database
- **No bottom navigation on Settings** — Settings is an auxiliary page; including the bottom nav would imply it is a primary destination, which it is not. The Home icon in the top-left is the only exit.
- **Gear icon on Home page only** — placing Settings access on the home page is consistent with mobile conventions (top-right corner); adding it to every page's nav would clutter the UI
- **`onToast` prop** — Settings page does not own the Toast component; it delegates notifications upward to `App.tsx` so only one Toast instance exists in the tree
- **`type="email"` on input** — the browser validates email format client-side before the form submits; the backend validates again with `@Email`

---

## Verification Steps

```
1. Navigate to Home page → confirm gear icon appears in top-right
2. Tap gear icon → Settings page opens with "Monthly Report Email" field
3. Field should be pre-filled with the saved value (or empty if not set)
4. Enter a valid email → tap Save → "Settings saved" toast appears
5. Navigate away and return to Settings → field shows the saved email
6. Clear the email field → tap Save → confirms disabling (null stored)
7. Enter an invalid email (e.g. "notanemail") → browser prevents form submission
8. Simulate API error (stop backend) → "Failed to save settings" error toast appears
```
