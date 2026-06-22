import { themeCssVars, themeFromEvent } from '../lib/eventTheme'
import type { Event, EventChallenge } from '../lib/types'
import { Sheet } from './Sheet'

interface ChallengesSheetProps {
  event: Event
  open: boolean
  onClose: () => void
  challenges: EventChallenge[]
  completed: Set<string>
  doneCount: number
  progress: number
  loadingList: boolean
  loadingCompletions: boolean
  busy: string | null
  onToggle: (challengeId: string) => void
}

function ChallengeSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className="challenge-skeleton flex items-start gap-3 rounded-xl border ev-border-subtle px-4 py-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mt-0.5 h-5 w-5 shrink-0 rounded-md bg-black/10" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="h-3.5 w-full rounded-md bg-black/10" />
        <div className="h-3.5 w-2/3 rounded-md bg-black/10" />
      </div>
    </div>
  )
}

export function ChallengesSheet({
  event,
  open,
  onClose,
  challenges,
  completed,
  doneCount,
  progress,
  loadingList,
  loadingCompletions,
  busy,
  onToggle,
}: ChallengesSheetProps) {
  const themeStyle = themeCssVars(themeFromEvent(event))
  const showSkeleton = loadingList && challenges.length === 0
  const allDone = challenges.length > 0 && doneCount === challenges.length

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={event.challenges_title || 'Desafios'}
      themeStyle={themeStyle}
    >
      {showSkeleton ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-black/10">
              <div className="challenge-progress-indeterminate h-full w-1/3 rounded-full ev-bg-primary" />
            </div>
            <p className="text-center text-xs ev-text-muted">Buscando desafios…</p>
          </div>
          <div className="space-y-2">
            {[0, 80, 160].map((delay) => (
              <ChallengeSkeleton key={delay} delay={delay} />
            ))}
          </div>
        </div>
      ) : challenges.length === 0 ? (
        <div className="challenge-fade-in py-10 text-center">
          <p className="text-4xl">🎯</p>
          <p className="mt-3 text-sm ev-text-muted">Nenhum desafio ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="challenge-fade-in space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium ev-text">
                {allDone ? '🎉 Todos concluídos!' : `${doneCount} de ${challenges.length} concluídos`}
              </p>
              <span className="text-xs font-semibold tabular-nums ev-text-muted">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className="challenge-progress-fill h-full rounded-full ev-bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <ul className="space-y-2">
            {challenges.map((challenge, index) => {
              const isDone = completed.has(challenge.id)
              const pendingCompletion = loadingCompletions && !isDone
              return (
                <li
                  key={challenge.id}
                  className="challenge-enter"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
                      isDone
                        ? 'ev-border-accent ev-bg-primary-soft scale-[1.01]'
                        : 'ev-border-subtle hover:ev-border-accent'
                    } ${pendingCompletion ? 'opacity-80' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      disabled={busy === challenge.id || pendingCompletion}
                      onChange={() => onToggle(challenge.id)}
                      className="mt-1 h-5 w-5 shrink-0 accent-[var(--ev-primary)] transition-transform duration-200 checked:scale-110"
                    />
                    <span
                      className={`text-sm transition-colors duration-200 ${
                        isDone ? 'line-through ev-text-muted' : 'ev-text'
                      }`}
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
