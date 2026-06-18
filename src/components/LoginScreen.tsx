import { useEffect, useRef, useState, type FormEvent } from 'react'
import { searchUsernames, useAuth } from '../lib/auth'
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
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const q = username.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(() => {
      void searchUsernames(q)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
    }, 250)
    return () => clearTimeout(timer)
  }, [username])

  function handleUsernameFocus() {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setShowSuggestions(true)
  }

  function handleUsernameBlur() {
    blurTimer.current = setTimeout(() => setShowSuggestions(false), 150)
  }

  function pickSuggestion(name: string) {
    setUsername(name)
    setShowSuggestions(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setShowSuggestions(false)
    try {
      await login(username, password, event.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    }
  }

  const visibleSuggestions =
    showSuggestions && suggestions.length > 0 && username.trim().length >= 2

  return (
    <div className="relative flex min-h-screen items-center justify-center ev-gradient-page p-4">
      {onBack && (
        <button
          onClick={onBack}
          className="ev-btn-ghost absolute left-4 top-4 rounded-lg px-3 py-1.5 text-sm transition"
        >
          ← Voltar
        </button>
      )}
      <form
        onSubmit={handleSubmit}
        className="ev-surface w-full max-w-sm rounded-3xl p-8 shadow-2xl backdrop-blur"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl ev-bg-primary-soft p-2">
            <EventLogo event={event} className="max-h-full max-w-full text-3xl" fallbackEmoji={typeInfo.emoji} />
          </div>
          <h1 className="text-2xl font-bold ev-text">{event.name}</h1>
          <p className="mt-1 text-sm ev-text-muted">
            Entre com nome e sobrenome + senha para postar e ver as fotos deste
            evento.
          </p>
        </div>

        <label className="mb-2 block text-sm font-medium ev-text" htmlFor="username">
          Nome e sobrenome
        </label>
        <div className="relative">
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={handleUsernameFocus}
            onBlur={handleUsernameBlur}
            placeholder="ex.: João Silva"
            autoFocus
            autoComplete="name"
            maxLength={60}
            className="ev-input ev-focus w-full rounded-xl px-4 py-3 outline-none"
          />
          {visibleSuggestions && (
            <ul
              className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border ev-border-subtle ev-surface shadow-lg"
              role="listbox"
            >
              {suggestions.map((name) => (
                <li key={name} role="option">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(name)}
                    className="w-full px-4 py-2.5 text-left text-sm ev-text transition hover:bg-black/5"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="mb-2 mt-4 block text-sm font-medium ev-text" htmlFor="password">
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
          className="ev-input ev-focus w-full rounded-xl px-4 py-3 outline-none"
        />

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !username.trim() || !password}
          className="mt-5 w-full rounded-xl px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ev-bg-primary ev-bg-primary-hover"
        >
          {loading ? 'Entrando…' : 'Entrar no evento'}
        </button>
        <p className="mt-3 text-center text-xs ev-text-muted">
          Use nome e sobrenome. Nome novo cria a conta; nome existente exige a senha
          correta.
        </p>
      </form>
    </div>
  )
}
