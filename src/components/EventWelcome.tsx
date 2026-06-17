import { getEventJoinUrl } from '../lib/appUrl'
import { getEventTypeInfo } from '../lib/eventTypes'
import { formatEventDate } from '../lib/format'
import type { Event, EventStats } from '../lib/types'
import { EventLogo } from './EventLogo'

interface EventWelcomeProps {
  event: Event
  stats: EventStats
  onJoin: () => void
}

export function EventWelcome({ event, stats, onJoin }: EventWelcomeProps) {
  const typeInfo = getEventTypeInfo(event.event_type)
  const dateLabel = formatEventDate(event.event_date)
  const totalMedia = stats.photos + stats.videos

  return (
    <div className="flex min-h-screen flex-col ev-gradient-welcome">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl ev-bg-primary-soft p-3 shadow-lg">
          <EventLogo event={event} className="max-h-full max-w-full text-5xl" fallbackEmoji={typeInfo.emoji} />
        </div>

        <p className="text-sm font-medium uppercase tracking-widest ev-text-accent">
          {typeInfo.label}
        </p>
        <h1 className="mt-2 max-w-md text-3xl font-bold text-white">{event.name}</h1>

        {dateLabel && <p className="mt-2 text-zinc-400">{dateLabel}</p>}

        {event.description && (
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
            {event.description}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-zinc-300">
          <span>
            <strong className="text-white">{totalMedia}</strong> mídias
          </span>
          <span className="text-zinc-600">•</span>
          <span>
            <strong className="text-white">{stats.members}</strong> participantes
          </span>
        </div>

        <div className="mt-10 w-full max-w-sm space-y-3">
          <button
            onClick={onJoin}
            className="w-full rounded-2xl px-6 py-4 text-lg font-bold text-white transition ev-bg-primary ev-bg-primary-hover ev-shadow-primary"
          >
            Participar do evento
          </button>
          <p className="text-xs text-zinc-500">
            Compartilhe suas fotos e vídeos — sem baixar app, direto pelo navegador.
          </p>
        </div>
      </div>

      <footer className="border-t border-white/5 px-6 py-4 text-center text-xs text-zinc-600">
        Feed colaborativo • {getEventJoinUrl(event.id).replace(/^https?:\/\//, '')}
      </footer>
    </div>
  )
}
