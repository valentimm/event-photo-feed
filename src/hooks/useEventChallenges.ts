import { useCallback, useEffect, useState } from 'react'
import {
  fetchEventChallenges,
  fetchUserChallengeCompletions,
  setChallengeCompleted,
} from '../lib/events'
import type { EventChallenge } from '../lib/types'

interface UseEventChallengesOptions {
  eventId: string
  enabled: boolean
  userId?: string
}

export function useEventChallenges({ eventId, enabled, userId }: UseEventChallengesOptions) {
  const [challenges, setChallenges] = useState<EventChallenge[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [loadingList, setLoadingList] = useState(enabled)
  const [loadingCompletions, setLoadingCompletions] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled) return

    setLoadingList(true)
    try {
      const list = await fetchEventChallenges(eventId)
      setChallenges(list)
      setLoadingList(false)

      if (userId && list.length > 0) {
        setLoadingCompletions(true)
        try {
          const done = await fetchUserChallengeCompletions(
            userId,
            list.map((c) => c.id),
          )
          setCompleted(done)
        } finally {
          setLoadingCompletions(false)
        }
      } else {
        setCompleted(new Set())
      }
    } catch {
      setLoadingList(false)
      setLoadingCompletions(false)
    }
  }, [enabled, eventId, userId])

  useEffect(() => {
    if (enabled) void load()
    else {
      setChallenges([])
      setCompleted(new Set())
      setLoadingList(false)
      setLoadingCompletions(false)
    }
  }, [enabled, load])

  const toggle = useCallback(
    async (challengeId: string) => {
      if (!userId || busy) return
      const wasDone = completed.has(challengeId)
      setBusy(challengeId)
      setCompleted((prev) => {
        const next = new Set(prev)
        if (wasDone) next.delete(challengeId)
        else next.add(challengeId)
        return next
      })
      try {
        await setChallengeCompleted(challengeId, userId, !wasDone)
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
    },
    [busy, completed, userId],
  )

  const doneCount = challenges.filter((c) => completed.has(c.id)).length
  const progress = challenges.length > 0 ? Math.round((doneCount / challenges.length) * 100) : 0

  return {
    challenges,
    completed,
    doneCount,
    progress,
    loadingList,
    loadingCompletions,
    busy,
    toggle,
    refresh: load,
  }
}
