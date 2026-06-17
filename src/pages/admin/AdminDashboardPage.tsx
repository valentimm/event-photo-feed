import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAdminAuth } from '../../lib/adminAuth'
import { EVENT_TYPES, getEventTypeInfo, type EventType } from '../../lib/eventTypes'
import { formatEventDate } from '../../lib/format'
import { createEvent, fetchEventsWithStats } from '../../lib/events'
import type { EventWithStats } from '../../lib/types'

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-lg bg-zinc-800/80 px-2 py-1 text-xs text-zinc-300">
      {label}: <strong className="text-white">{value}</strong>
    </span>
  )
}

export function AdminDashboardPage() {
  const { admin, logout } = useAdminAuth()
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<EventType>('wedding')
  const [newDate, setNewDate] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function loadEvents() {
    setLoading(true)
    setError(null)
    try {
      setEvents(await fetchEventsWithStats())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEvents()
  }, [])

  if (!admin) return <Navigate to="/admin" replace />

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      await createEvent({
        name: newName,
        eventType: newType,
        eventDate: newDate || null,
        description: newDescription || null,
      })
      setNewName('')
      setNewDate('')
      setNewDescription('')
      setNewType('wedding')
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-white/10 bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">Painel Admin</h1>
            <p className="text-sm text-zinc-400">Olá, {admin.username}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:text-white"
            >
              App
            </Link>
            <button
              onClick={logout}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 font-semibold">Criar evento</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do evento (ex.: Casamento João & Maria)"
              maxLength={120}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none focus:border-indigo-400"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as EventType)}
                className="rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none focus:border-indigo-400"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.emoji} {t.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none focus:border-indigo-400"
              />
            </div>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Descrição opcional (ex.: Compartilhe suas fotos do nosso grande dia!)"
              maxLength={300}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="w-full rounded-xl bg-indigo-500 px-5 py-3 font-semibold transition hover:bg-indigo-400 disabled:opacity-50 sm:w-auto"
            >
              {creating ? 'Criando…' : 'Criar evento + QR Code'}
            </button>
          </form>
        </section>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="font-semibold">Eventos</h2>
          {loading && <p className="text-zinc-500">Carregando…</p>}
          {!loading && events.length === 0 && (
            <p className="text-zinc-500">Nenhum evento ainda. Crie o primeiro acima.</p>
          )}
          {events.map((event) => {
            const typeInfo = getEventTypeInfo(event.event_type)
            return (
              <Link
                key={event.id}
                to={`/admin/events/${event.id}`}
                className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-indigo-400/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{typeInfo.emoji}</span>
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatEventDate(event.event_date) ?? 'Sem data'} · Criado{' '}
                      {new Date(event.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      event.is_active
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    {event.is_active ? 'Ativo' : 'Encerrado'}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatBadge label="Usuários" value={event.stats.members} />
                  <StatBadge label="Fotos" value={event.stats.photos} />
                  <StatBadge label="Vídeos" value={event.stats.videos} />
                  <StatBadge label="Curtidas" value={event.stats.likes} />
                  <StatBadge label="Comentários" value={event.stats.comments} />
                </div>
              </Link>
            )
          })}
        </section>
      </main>
    </div>
  )
}
