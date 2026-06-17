import type { ReactNode } from 'react'
import { themeCssVars, themeFromEvent } from '../lib/eventTheme'
import type { Event } from '../lib/types'

export function EventThemeProvider({
  event,
  children,
  className = '',
}: {
  event: Event
  children: ReactNode
  className?: string
}) {
  const theme = themeFromEvent(event)
  return (
    <div className={`event-theme ${className}`.trim()} style={themeCssVars(theme)}>
      {children}
    </div>
  )
}
