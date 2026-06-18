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

function extFromUrl(url: string, mediaType: string): string {
  const path = url.split('?')[0]
  const match = path.match(/\.([a-zA-Z0-9]+)$/)
  if (match) return match[1].toLowerCase()
  return mediaType === 'video' ? 'mp4' : 'jpg'
}

function safeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'arquivo'
}

export interface MediaDownloadItem {
  url: string
  media_type: string
  created_at: string
  username: string
}

/** Baixa cada mídia como arquivo (foto/vídeo), com pequeno intervalo entre downloads. */
export async function downloadAllMedia(
  items: MediaDownloadItem[],
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const ext = extFromUrl(item.url, item.media_type)
    const date = item.created_at.slice(0, 10)
    const filename = `${safeFilenamePart(item.username)}-${date}-${String(i + 1).padStart(3, '0')}.${ext}`
    await downloadMedia(item.url, filename)
    onProgress?.(i + 1, items.length)
    if (i < items.length - 1) {
      await new Promise((r) => setTimeout(r, 400))
    }
  }
}
