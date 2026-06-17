import { getEventJoinUrl } from '../lib/appUrl'
import { useAuth } from '../lib/auth'
import type { EventStats } from '../lib/types'

interface HeaderProps {
  eventId: string
  eventName: string
  stats?: EventStats
}

export function Header({ eventId, eventName, stats }: HeaderProps) {
  const { user, logout } = useAuth()
  const totalMedia = stats ? stats.photos + stats.videos : null

  async function handleShare() {
    const url = getEventJoinUrl(eventId)
    if (navigator.share) {
      try {
        await navigator.share({ title: eventName, text: 'Participe do nosso evento!', url })
        return
      } catch {
        /* cancelado */
      }
    }
    await navigator.clipboard.writeText(url)
    alert('Link copiado!')
  }

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto max-w-xl px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">📸</span>
              <span className="truncate font-bold text-white">{eventName}</span>
            </div>
            {stats && (
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {totalMedia} mídias · {stats.members} participantes
                {stats.likes > 0 && ` · ${stats.likes} curtidas`}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleShare}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm text-zinc-300 transition hover:text-white"
              title="Compartilhar evento"
            >
              ↗
            </button>
            <span className="hidden text-sm text-zinc-400 sm:inline">
              {user?.username?.split(' ')[0]}
            </span>
            <button
              onClick={logout}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
