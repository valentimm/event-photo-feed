import { themeFromEvent } from '../lib/eventTheme'
import type { Event } from '../lib/types'

interface EventLogoProps {
  event: Event
  className?: string
  fallbackEmoji?: string
}

/** Logo do evento ou emoji padrão do tipo. */
export function EventLogo({ event, className = '', fallbackEmoji = '📸' }: EventLogoProps) {
  const theme = themeFromEvent(event)
  if (theme.logo_url) {
    return (
      <img
        src={theme.logo_url}
        alt={`Logo ${event.name}`}
        className={`object-contain ${className}`}
      />
    )
  }
  return <span className={className}>{fallbackEmoji}</span>
}
