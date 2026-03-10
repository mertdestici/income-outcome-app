import { api } from './api'

export interface UserSettings {
  reportEmail: string | null
}

export function getSettings(): Promise<UserSettings> {
  return api.get<UserSettings>('/api/settings')
}

export function updateSettings(reportEmail: string | null): Promise<UserSettings> {
  return api.put<UserSettings>('/api/settings', { reportEmail })
}
