import type { Photo } from './types'

export function formatEventDate(date: string | null | undefined): string | null {
  if (!date) return null
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(d, today)) return 'Hoje'
  if (sameDay(d, yesterday)) return 'Ontem'

  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Agrupa fotos por dia (label legível) mantendo ordem decrescente. */
export function groupPhotosByDay(photos: Photo[]): { label: string; items: Photo[] }[] {
  const map = new Map<string, Photo[]>()
  for (const photo of photos) {
    const label = formatDayLabel(photo.created_at)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(photo)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

export async function downloadMedia(url: string, filename: string) {
  const res = await fetch(url)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  a.click()
  URL.revokeObjectURL(objectUrl)
}
