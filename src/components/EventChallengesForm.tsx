import { useEffect, useState, type FormEvent } from 'react'
import {
  addEventChallenge,
  fetchEventChallenges,
  removeEventChallenge,
  updateEventChallengesSettings,
} from '../lib/events'
import type { Event, EventChallenge } from '../lib/types'

interface EventChallengesFormProps {
  event: Event
  onUpdated: (event: Event) => void
}

export function EventChallengesForm({ event, onUpdated }: EventChallengesFormProps) {
  const [enabled, setEnabled] = useState(event.challenges_enabled ?? false)
  const [title, setTitle] = useState(event.challenges_title ?? 'Desafios')
  const [challenges, setChallenges] = useState<EventChallenge[]>([])
  const [newText, setNewText] = useState('')
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
        const list = await fetchEventChallenges(event.id)
        setChallenges(list)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar desafios.')
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
      const updated = await updateEventChallengesSettings(event.id, {
        challenges_enabled: enabled,
        challenges_title: title,
      })
      onUpdated(updated)
      setSuccess('Configuração de desafios salva!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newText.trim()) return
    setAdding(true)
    setError(null)
    try {
      const created = await addEventChallenge(event.id, newText)
      setChallenges((prev) => [...prev, created])
      setNewText('')
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
      await removeEventChallenge(id)
      setChallenges((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-4 font-semibold">Desafios</h2>

      <form onSubmit={handleSaveSettings} className="space-y-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm">Habilitar seção de desafios no evento</span>
        </label>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Título exibido aos participantes</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Desafios"
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500/50"
          />
        </div>

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
            Desafios do evento ({challenges.length})
          </h3>

          {loading ? (
            <p className="text-sm text-zinc-500">Carregando…</p>
          ) : (
            <>
              {challenges.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {challenges.map((c, i) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-zinc-900/50 px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="mr-2 text-zinc-500">{i + 1}.</span>
                        {c.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleRemove(c.id)}
                        disabled={removing === c.id}
                        className="shrink-0 text-zinc-500 hover:text-red-400 disabled:opacity-50"
                        aria-label="Remover desafio"
                      >
                        {removing === c.id ? '…' : '✕'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleAdd} className="flex gap-2">
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Novo desafio…"
                  maxLength={200}
                  className="flex-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500/50"
                />
                <button
                  type="submit"
                  disabled={adding || !newText.trim()}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                >
                  {adding ? '…' : 'Adicionar'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </section>
  )
}
