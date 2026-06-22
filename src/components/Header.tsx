import { useState } from 'react'
import { getEventJoinUrl } from '../lib/appUrl'
import { useAuth } from '../lib/auth'
import { useEventChallenges } from '../hooks/useEventChallenges'
import type { Event, EventStats } from '../lib/types'
import { ChallengesSheet } from './ChallengesSheet'
import { EventLogo } from './EventLogo'

interface HeaderProps {
  event: Event
  stats?: EventStats
}

export function Header({ event, stats }: HeaderProps) {
  const { user, logout } = useAuth()
  const [challengesOpen, setChallengesOpen] = useState(false)
  const totalMedia = stats ? stats.photos + stats.videos : null
  const challengesEnabled = event.challenges_enabled ?? false
  const challenges = useEventChallenges({
    eventId: event.id,
    enabled: challengesEnabled,
    userId: user?.id,
  })

  async function handleShare() {
    const url = getEventJoinUrl(event.id)
    if (navigator.share) {
      try {
        await navigator.share({ title: event.name, text: 'Participe do nosso evento!', url })
        return
      } catch {
        /* cancelado */
      }
    }
    await navigator.clipboard.writeText(url)
    alert('Link copiado!')
  }

  return (
    <header className="ev-header-bar sticky top-0 z-10">
      <div className="mx-auto max-w-xl px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ev-bg-primary-soft p-1">
              <EventLogo event={event} className="max-h-full max-w-full text-lg" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-bold ev-text">{event.name}</span>
              {stats && (
                <p className="truncate text-xs ev-text-muted">
                  {totalMedia} mídias · {stats.members} participantes
                  {stats.likes > 0 && ` · ${stats.likes} curtidas`}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {challengesEnabled && (
              <button
                onClick={() => setChallengesOpen(true)}
                className="relative ev-btn-ghost rounded-lg px-2.5 py-1.5 text-sm transition"
                title={event.challenges_title || 'Desafios'}
              >
                🎯
                {challenges.challenges.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white ev-bg-primary">
                    {challenges.doneCount}/{challenges.challenges.length}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={handleShare}
              className="ev-btn-ghost rounded-lg px-2.5 py-1.5 text-sm transition"
              title="Compartilhar evento"
            >
              ↗
            </button>
            <span className="hidden text-sm ev-text-muted sm:inline">
              {user?.username?.split(' ')[0]}
            </span>
            <button onClick={logout} className="ev-btn-ghost rounded-lg px-3 py-1.5 text-sm transition">
              Sair
            </button>
          </div>
        </div>
      </div>
      {challengesEnabled && (
        <ChallengesSheet
          event={event}
          open={challengesOpen}
          onClose={() => setChallengesOpen(false)}
          challenges={challenges.challenges}
          completed={challenges.completed}
          doneCount={challenges.doneCount}
          progress={challenges.progress}
          loadingList={challenges.loadingList}
          loadingCompletions={challenges.loadingCompletions}
          busy={challenges.busy}
          onToggle={(id) => void challenges.toggle(id)}
        />
      )}
    </header>
  )
}
