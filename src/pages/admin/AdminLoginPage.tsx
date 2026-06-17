import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../lib/adminAuth'

export function AdminLoginPage() {
  const { admin, login, loading } = useAdminAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (admin) return <Navigate to="/admin/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(username, password)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-zinc-950 to-fuchsia-950 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-3xl">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <p className="mt-1 text-sm text-zinc-400">Painel de gerenciamento de eventos</p>
        </div>

        <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="admin-user">
          Usuário
        </label>
        <input
          id="admin-user"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          autoComplete="username"
          className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none focus:border-indigo-400"
        />

        <label
          className="mb-2 mt-4 block text-sm font-medium text-zinc-300"
          htmlFor="admin-pass"
        >
          Senha
        </label>
        <input
          id="admin-pass"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none focus:border-indigo-400"
        />

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <Link to="/" className="mt-4 block text-center text-sm text-zinc-500 hover:text-white">
          ← Voltar ao app
        </Link>
      </form>
    </div>
  )
}
