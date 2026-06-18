import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import {
  fetchEventChallenges,
  fetchUserChallengeCompletions,
  setChallengeCompleted,
} from '../lib/events'
import type { Event, EventChallenge } from '../lib/types'
import { themeCssVars, themeFromEvent } from '../lib/eventTheme'
import { Sheet } from './Sheet'

interface ChallengesSheetProps {
  event: Event
  open: boolean
  onClose: () => void
}

export function ChallengesSheet({ event, open, onClose }: ChallengesSheetProps) {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<EventChallenge[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !event.challenges_enabled) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const list = await fetchEventChallenges(event.id)
        if (cancelled) return
        setChallenges(list)
        if (user) {
          const done = await fetchUserChallengeCompletions(
            user.id,
            list.map((c) => c.id),
          )
          if (!cancelled) setCompleted(done)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, event.id, event.challenges_enabled, user])

  async function toggle(challengeId: string) {
    if (!user || busy) return
    const wasDone = completed.has(challengeId)
    setBusy(challengeId)
    setCompleted((prev) => {
      const next = new Set(prev)
      if (wasDone) next.delete(challengeId)
      else next.add(challengeId)
      return next
    })
    try {
      await setChallengeCompleted(challengeId, user.id, !wasDone)
    } catch {
      setCompleted((prev) => {
        const next = new Set(prev)
        if (wasDone) next.add(challengeId)
        else next.delete(challengeId)
        return next
      })
    } finally {
      setBusy(null)
    }
  }

  const doneCount = challenges.filter((c) => completed.has(c.id)).length
  const themeStyle = themeCssVars(themeFromEvent(event))

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={event.challenges_title || 'Desafios'}
      themeStyle={themeStyle}
    >
      {loading ? (
        <p className="py-8 text-center ev-text-muted">Carregando…</p>
      ) : challenges.length === 0 ? (
        <p className="py-8 text-center ev-text-muted">Nenhum desafio ainda.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm ev-text-muted">
            {doneCount} de {challenges.length} concluídos
          </p>
          <ul className="space-y-2">
            {challenges.map((challenge) => {
              const isDone = completed.has(challenge.id)
              return (
                <li key={challenge.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                      isDone ? 'ev-border-accent ev-bg-primary-soft' : 'ev-border-subtle'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      disabled={busy === challenge.id}
                      onChange={() => void toggle(challenge.id)}
                      className="mt-1 h-5 w-5 shrink-0 accent-[var(--ev-primary)]"
                    />
                    <span
                      className={`text-sm ${isDone ? 'line-through ev-text-muted' : 'ev-text'}`}
                    >
                      {challenge.text}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Sheet>
  )
}
