import { useEffect, useState, type FormEvent } from 'react'
import {
  addEventTeam,
  fetchEventTeams,
  removeEventTeam,
  updateEventTeamsSettings,
} from '../lib/events'
import type { Event, EventTeam } from '../lib/types'

interface EventTeamsFormProps {
  event: Event
  onUpdated: (event: Event) => void
}

export function EventTeamsForm({ event, onUpdated }: EventTeamsFormProps) {
  const [enabled, setEnabled] = useState(event.teams_enabled ?? false)
  const [teams, setTeams] = useState<EventTeam[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const list = await fetchEventTeams(event.id)
        setTeams(list)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar times.')
      } finally {
        setLoading(false)
      }
    })()
  }, [event.id])

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await updateEventTeamsSettings(event.id, enabled)
      onUpdated(updated)
      setSuccess('Configuração de times salva!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setError(null)
    try {
      const created = await addEventTeam(event.id, newName)
      setTeams((prev) => [...prev, created])
      setNewName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(id: string) {
    setRemoving(id)
    setError(null)
    try {
      await removeEventTeam(id)
      setTeams((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-4 font-semibold">Times</h2>

      <form onSubmit={handleSaveSettings} className="space-y-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm">Pedir escolha de time ao entrar no evento</span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold hover:bg-fuchsia-500 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar configuração'}
        </button>
      </form>

      {success && <p className="mt-3 text-sm text-emerald-400">{success}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {enabled && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <h3 className="mb-3 text-sm font-medium text-zinc-300">
            Opções de time ({teams.length})
          </h3>

          {loading ? (
            <p className="text-sm text-zinc-500">Carregando…</p>
          ) : (
            <>
              {teams.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {teams.map((t, i) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-zinc-900/50 px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="mr-2 text-zinc-500">{i + 1}.</span>
                        {t.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleRemove(t.id)}
                        disabled={removing === t.id}
                        className="shrink-0 text-zinc-500 hover:text-red-400 disabled:opacity-50"
                        aria-label="Remover time"
                      >
                        {removing === t.id ? '…' : '✕'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleAdd} className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do time…"
                  maxLength={80}
                  className="flex-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500/50"
                />
                <button
                  type="submit"
                  disabled={adding || !newName.trim()}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                >
                  {adding ? '…' : 'Adicionar'}
                </button>
              </form>

              {teams.length === 0 && (
                <p className="mt-3 text-xs text-zinc-500">
                  Adicione ao menos um time para que os participantes possam escolher.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
