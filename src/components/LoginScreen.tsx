import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { getEventTypeInfo } from '../lib/eventTypes'
import type { Event } from '../lib/types'
import { EventLogo } from './EventLogo'

interface LoginScreenProps {
  event: Event
  onBack?: () => void
}

export function LoginScreen({ event, onBack }: LoginScreenProps) {
  const { login, loading } = useAuth()
  const typeInfo = getEventTypeInfo(event.event_type)
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
    <div className="relative flex min-h-screen items-center justify-center ev-gradient-page p-4">
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
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl ev-bg-primary-soft p-2">
            <EventLogo event={event} className="max-h-full max-w-full text-3xl" fallbackEmoji={typeInfo.emoji} />
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
          className="ev-focus w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 outline-none"
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
          className="ev-focus w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 outline-none"
        />

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !username.trim() || !password}
          className="mt-5 w-full rounded-xl px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ev-bg-primary ev-bg-primary-hover"
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
