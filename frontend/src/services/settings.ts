import { api } from './api'

export interface UserSettings {
  reportEmail: string | null
  timezone: string
  dailyReminderEnabled: boolean
  monthlyLedgerEnabled: boolean
}

export function getSettings(): Promise<UserSettings> {
  return api.get<UserSettings>('/api/settings')
}

export function updateSettings(settings: UserSettings): Promise<UserSettings> {
  return api.put<UserSettings>('/api/settings', settings)
}
