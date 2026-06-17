import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import type { Event } from '../lib/types'

interface LoginScreenProps {
  event: Event
  onBack?: () => void
}

export function LoginScreen({ event, onBack }: LoginScreenProps) {
  const { login, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(username, password, event.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-fuchsia-950 via-zinc-950 to-indigo-950 p-4">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-4 top-4 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-400 hover:text-white"
        >
          ← Voltar
        </button>
      )}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/20 text-3xl">
            📸
          </div>
          <h1 className="text-2xl font-bold text-white">{event.name}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Entre com nome e sobrenome + senha para postar e ver as fotos deste
            evento.
          </p>
        </div>

        <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="username">
          Nome e sobrenome
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ex.: João Silva"
          autoFocus
          autoComplete="name"
          maxLength={60}
          className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/40"
        />

        <label
          className="mb-2 mt-4 block text-sm font-medium text-zinc-300"
          htmlFor="password"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="sua senha"
          autoComplete="current-password"
          maxLength={100}
          className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/40"
        />

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !username.trim() || !password}
          className="mt-5 w-full rounded-xl bg-fuchsia-500 px-4 py-3 font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Entrando…' : 'Entrar no evento'}
        </button>
        <p className="mt-3 text-center text-xs text-zinc-500">
          Use nome e sobrenome. Nome novo cria a conta; nome existente exige a senha
          correta.
        </p>
      </form>
    </div>
  )
}
