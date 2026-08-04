import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { refresh } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    await refresh()
    setLoading(false)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bone px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="/logo-full.svg" alt="Vetronaviglio" className="h-16 w-auto" />
        </div>
        <h1 className="font-display text-4xl mb-2 text-center font-semibold tracking-tight">
          Listino Vetronaviglio
        </h1>
        <p className="mb-12 text-center font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum">
          Accesso commerciali
        </p>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-aluminum mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border-b border-aluminum/40 bg-transparent py-2 font-sans text-sm text-onyx placeholder:text-aluminum/50 focus:border-onyx focus:outline-none transition-colors"
              placeholder="nome@vetronaviglio.it"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-aluminum mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border-b border-aluminum/40 bg-transparent py-2 font-sans text-sm text-onyx placeholder:text-aluminum/50 focus:border-onyx focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-[10px] text-red-600 uppercase tracking-widest">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-onyx text-bone py-4 font-sans text-xs uppercase tracking-[0.2em] font-medium hover:bg-aluminum transition-all disabled:opacity-50"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}
