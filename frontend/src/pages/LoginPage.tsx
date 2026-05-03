import React, { useState } from 'react'
import { authService } from '../services/auth'

const inputCls = "rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"

export default function LoginPage({ onSuccess, onGoRegister }: {
  onSuccess: (token: string, email: string) => void
  onGoRegister: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await authService.login(email.trim(), password)
      onSuccess(res.token, res.email)
    } catch (err: any) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">Sign in</h1>
        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-6 grid gap-4">
          <div className="grid gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email}
              onChange={e => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" required value={password}
              onChange={e => setPassword(e.target.value)} className={inputCls} />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" disabled={loading}
            className="rounded-xl bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 font-medium active:scale-95">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          No account?{' '}
          <button onClick={onGoRegister} className="text-indigo-600 dark:text-indigo-400 font-medium">Register</button>
        </p>
      </div>
    </div>
  )
}
