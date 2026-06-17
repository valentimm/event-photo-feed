import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { fetchEvent, fetchEventStats, joinEvent } from '../lib/events'
import type { Event, EventStats } from '../lib/types'
import { EventThemeProvider } from '../components/EventThemeProvider'
import { EventWelcome } from '../components/EventWelcome'
import { Header } from '../components/Header'
import { Feed } from '../components/Feed'
import { LoginScreen } from '../components/LoginScreen'

export function EventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const [data, st] = await Promise.all([fetchEvent(eventId), fetchEventStats(eventId)])
        if (cancelled) return
        if (!data) {
          setError('Evento não encontrado.')
          setEvent(null)
        } else {
          setEvent(data)
          setStats(st)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar evento.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [eventId])

  useEffect(() => {
    if (!eventId || !user) return
    const interval = setInterval(() => {
      void fetchEventStats(eventId).then(setStats).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [eventId, user])

  useEffect(() => {
    if (user && event?.is_active) {
      void joinEvent(event.id, user.id).catch(() => {})
    }
  }, [user, event])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500">
        Carregando evento…
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-6 text-center">
        <p className="text-red-400">{error ?? 'Evento não encontrado.'}</p>
        <Link to="/" className="text-sm text-zinc-400 hover:text-white">
          ← Voltar
        </Link>
      </div>
    )
  }

  if (!event.is_active) {
    return (
      <EventThemeProvider event={event} className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-xl font-semibold ev-text">{event.name}</p>
        <p className="ev-text-muted">Este evento está encerrado.</p>
        <Link to="/" className="text-sm ev-link-muted">
          ← Voltar
        </Link>
      </EventThemeProvider>
    )
  }

  if (!user) {
    return (
      <EventThemeProvider event={event} className="min-h-screen">
        {!showLogin && stats ? (
          <EventWelcome event={event} stats={stats} onJoin={() => setShowLogin(true)} />
        ) : (
          <LoginScreen event={event} onBack={stats ? () => setShowLogin(false) : undefined} />
        )}
      </EventThemeProvider>
    )
  }

  return (
    <EventThemeProvider event={event} className="min-h-screen ev-bg-page">
      <Header event={event} stats={stats ?? undefined} />
      <Feed eventId={event.id} />
    </EventThemeProvider>
  )
}
