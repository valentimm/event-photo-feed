import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getEventJoinUrl } from '../../lib/appUrl'
import { useAdminAuth } from '../../lib/adminAuth'
import {
  fetchEvent,
  fetchEventMediaExport,
  fetchEventStats,
  fetchEventUsers,
  setEventActive,
} from '../../lib/events'
import type { Event, EventStats, EventUserRow } from '../../lib/types'
import { getEventTypeInfo } from '../../lib/eventTypes'
import { formatEventDate } from '../../lib/format'
import { QrCodeCard } from '../../components/QrCodeCard'

export function AdminEventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { admin } = useAdminAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [stats, setStats] = useState<EventStats | null>(null)
  const [users, setUsers] = useState<EventUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!eventId) return
    setLoading(true)
    setError(null)
    try {
      const [ev, st, us] = await Promise.all([
        fetchEvent(eventId),
        fetchEventStats(eventId),
        fetchEventUsers(eventId),
      ])
      if (!ev) {
        setError('Evento não encontrado.')
        return
      }
      setEvent(ev)
      setStats(st)
      setUsers(us)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [eventId])

  async function toggleActive() {
    if (!event) return
    setToggling(true)
    try {
      await setEventActive(event.id, !event.is_active)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar evento.')
    } finally {
      setToggling(false)
    }
  }

  async function exportMedia() {
    if (!eventId || !event) return
    setExporting(true)
    try {
      const items = await fetchEventMediaExport(eventId)
      if (items.length === 0) {
        alert('Nenhuma mídia para exportar.')
        return
      }
      const lines = [
        'url,tipo,autor,data',
        ...items.map(
          (i) => `"${i.url}","${i.media_type}","${i.username}","${i.created_at}"`,
        ),
      ]
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${event.name}-midias.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar.')
    } finally {
      setExporting(false)
    }
  }

  if (!admin) return <Navigate to="/admin" replace />

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500">
        Carregando…
      </div>
    )
  }

  if (error || !event || !stats) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-6">
        <p className="text-red-400">{error ?? 'Evento não encontrado.'}</p>
        <Link to="/admin/dashboard" className="text-sm text-zinc-400 hover:text-white">
          ← Voltar
        </Link>
      </div>
    )
  }

  const joinUrl = getEventJoinUrl(event.id)
  const typeInfo = getEventTypeInfo(event.event_type)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <Link
              to="/admin/dashboard"
              className="text-sm text-zinc-400 hover:text-white"
            >
              ← Eventos
            </Link>
            <h1 className="mt-1 text-xl font-bold">
              {typeInfo.emoji} {event.name}
            </h1>
            {event.description && (
              <p className="mt-1 text-sm text-zinc-400">{event.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportMedia}
              disabled={exporting}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white disabled:opacity-50"
            >
              {exporting ? '…' : '⬇ Exportar mídias'}
            </button>
            <button
              onClick={toggleActive}
              disabled={toggling}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                event.is_active
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              {toggling ? '…' : event.is_active ? 'Encerrar evento' : 'Reativar evento'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <QrCodeCard url={joinUrl} />

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'Usuários', value: stats.members },
            { label: 'Fotos', value: stats.photos },
            { label: 'Vídeos', value: stats.videos },
            { label: 'Curtidas', value: stats.likes },
            { label: 'Comentários', value: stats.comments },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-center"
            >
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-zinc-400">{item.label}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 font-semibold">Usuários do evento ({users.length})</h2>
          {users.length === 0 ? (
            <p className="text-sm text-zinc-500">Ninguém entrou ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400">
                    <th className="pb-2 pr-4 font-medium">Nome</th>
                    <th className="pb-2 pr-4 font-medium">Entrou em</th>
                    <th className="pb-2 pr-4 font-medium">Posts</th>
                    <th className="pb-2 pr-4 font-medium">Curtidas</th>
                    <th className="pb-2 font-medium">Comentários</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.userId} className="border-b border-white/5">
                      <td className="py-3 pr-4 font-medium text-white">{u.username}</td>
                      <td className="py-3 pr-4 text-zinc-400">
                        {new Date(u.joinedAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 pr-4">{u.posts}</td>
                      <td className="py-3 pr-4">{u.likesGiven}</td>
                      <td className="py-3">{u.comments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-400">
          <p>
            <span className="text-zinc-300">ID do evento:</span>{' '}
            <code className="text-zinc-200">{event.id}</code>
          </p>
          <p className="mt-2">
            <span className="text-zinc-300">Status:</span>{' '}
            {event.is_active ? 'Ativo — aceita novos acessos' : 'Encerrado'}
          </p>
          <p className="mt-2">
            <span className="text-zinc-300">Tipo:</span> {typeInfo.label}
          </p>
          {event.event_date && (
            <p className="mt-2">
              <span className="text-zinc-300">Data do evento:</span>{' '}
              {formatEventDate(event.event_date)}
            </p>
          )}
          <p className="mt-2">
            <span className="text-zinc-300">Criado em:</span>{' '}
            {new Date(event.created_at).toLocaleString('pt-BR')}
          </p>
        </section>
      </main>
    </div>
  )
}
