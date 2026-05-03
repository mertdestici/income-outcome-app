import React, { useState } from 'react'
import { Wallet } from 'lucide-react'
import { authService } from '../services/auth'

const inputCls = "block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"

export default function RegisterPage({ onSuccess, onGoLogin }: {
  onSuccess: (token: string, email: string) => void
  onGoLogin: () => void
}) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

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
    <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create account</h1>
          <p className="text-sm text-slate-500 mt-1">Start tracking your finances</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/80 p-6">
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputCls}
                placeholder="Min. 8 characters"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 ring-1 ring-red-200">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full rounded-xl bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white px-4 py-3 font-semibold cursor-pointer active:scale-[0.98] transition-all duration-150 shadow-sm shadow-indigo-100 mt-1"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <button onClick={onGoLogin} className="text-indigo-600 font-semibold cursor-pointer hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
