import { useEffect } from 'react'
import { downloadMedia, formatTime } from '../lib/format'
import type { Photo } from '../lib/types'

interface MediaLightboxProps {
  photos: Photo[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function MediaLightbox({ photos, index, onClose, onNavigate }: MediaLightboxProps) {
  const photo = photos[index]

  useEffect(() => {
    if (!photo) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1)
      if (e.key === 'ArrowRight' && index < photos.length - 1) onNavigate(index + 1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, photos.length, onClose, onNavigate, photo])

  if (!photo) return null

  async function handleDownload() {
    const ext = photo.media_type === 'video' ? 'mp4' : 'jpg'
    await downloadMedia(photo.image_url, `${photo.user?.username ?? 'media'}-${photo.id.slice(0, 8)}.${ext}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-semibold text-white">
            {photo.user?.username ?? 'Anônimo'}
          </p>
          <p className="text-xs text-zinc-400">{formatTime(photo.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/10"
          >
            ⬇ Baixar
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {index > 0 && (
          <button
            onClick={() => onNavigate(index - 1)}
            className="absolute left-2 z-10 rounded-full bg-black/50 p-3 text-2xl text-white hover:bg-black/70"
          >
            ‹
          </button>
        )}

        {photo.media_type === 'video' ? (
          <video
            src={photo.image_url}
            controls
            autoPlay
            playsInline
            className="max-h-[70vh] max-w-full rounded-lg"
          />
        ) : (
          <img
            src={photo.image_url}
            alt={photo.caption ?? 'Foto'}
            className="max-h-[70vh] max-w-full rounded-lg object-contain"
          />
        )}

        {index < photos.length - 1 && (
          <button
            onClick={() => onNavigate(index + 1)}
            className="absolute right-2 z-10 rounded-full bg-black/50 p-3 text-2xl text-white hover:bg-black/70"
          >
            ›
          </button>
        )}
      </div>

      <div className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
        {photo.caption && <p className="text-sm text-zinc-300">{photo.caption}</p>}
        <p className="mt-1 text-xs text-zinc-500">
          {index + 1} de {photos.length}
        </p>
      </div>
    </div>
  )
}
