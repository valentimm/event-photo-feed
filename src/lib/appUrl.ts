/** URL base pública do app (usada nos QR codes). */
export function getAppBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_APP_URL as string | undefined
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:5173'
}

export function getEventJoinUrl(eventId: string): string {
  return `${getAppBaseUrl()}/e/${eventId}`
}
