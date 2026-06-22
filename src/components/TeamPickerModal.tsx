import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { fetchEventTeams, setUserTeam } from '../lib/events'
import type { Event, EventTeam } from '../lib/types'

interface TeamPickerModalProps {
  event: Event
  userId: string
  themeStyle?: CSSProperties
  onComplete: () => void
}

export function TeamPickerModal({ event, userId, themeStyle, onComplete }: TeamPickerModalProps) {
  const [teams, setTeams] = useState<EventTeam[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const list = await fetchEventTeams(event.id)
        if (!cancelled) setTeams(list)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar times.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [event.id])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    setSaving(true)
    setError(null)
    try {
      await setUserTeam(event.id, userId, selectedId)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar escolha.')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="team-picker-title"
        className="event-theme relative z-10 w-full max-w-sm rounded-2xl ev-surface p-6 shadow-2xl"
        style={themeStyle}
      >
        <h2 id="team-picker-title" className="text-xl font-bold ev-text">
          Escolha seu time
        </h2>
        <p className="mt-1 text-sm ev-text-muted">Esta escolha é única e não pode ser alterada depois.</p>

        {loading ? (
          <p className="mt-6 text-sm ev-text-muted">Carregando…</p>
        ) : teams.length === 0 ? (
          <p className="mt-6 text-sm text-amber-500">
            Nenhum time disponível no momento. Tente novamente mais tarde.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <fieldset className="space-y-2">
              {teams.map((team) => (
                <label
                  key={team.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                    selectedId === team.id
                      ? 'ev-border-primary ev-bg-primary-soft'
                      : 'ev-border-subtle hover:bg-black/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="team"
                    value={team.id}
                    checked={selectedId === team.id}
                    onChange={() => setSelectedId(team.id)}
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="text-sm font-medium ev-text">{team.name}</span>
                </label>
              ))}
            </fieldset>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={saving || !selectedId}
              className="mt-2 w-full rounded-xl px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ev-bg-primary ev-bg-primary-hover"
            >
              {saving ? 'Salvando…' : 'Confirmar'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
