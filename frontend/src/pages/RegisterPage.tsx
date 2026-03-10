import React, { useState } from 'react'
import { authService } from '../services/auth'

export default function RegisterPage({ onSuccess, onGoLogin }: {
  onSuccess: (token: string, email: string) => void
  onGoLogin: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError(null)
    setLoading(true)
    try {
      const res = await authService.register(email.trim(), password)
      onSuccess(res.token, res.email)
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Create account</h1>
        <form onSubmit={submit} className="bg-white rounded-2xl shadow border border-gray-200 p-6 grid gap-4">
          <div className="grid gap-1">
            <label className="text-sm text-gray-600" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-gray-600" htmlFor="password">Password
              <span className="text-gray-400 font-normal"> (min. 8 chars)</span>
            </label>
            <input id="password" type="password" autoComplete="new-password" required minLength={8} value={password}
              onChange={e => setPassword(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" disabled={loading}
            className="rounded-xl bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 font-medium active:scale-95">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <button onClick={onGoLogin} className="text-indigo-600 font-medium">Sign in</button>
        </p>
      </div>
    </div>
  )
}
