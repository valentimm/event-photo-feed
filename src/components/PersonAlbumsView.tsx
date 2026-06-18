import { useCallback, useEffect, useState } from 'react'
import { fetchFaceAlbumRanking, fetchPhotosForFace } from '../lib/events'
import type { FaceAlbumEntry, Photo } from '../lib/types'
import { MediaLightbox } from './MediaLightbox'

interface PersonAlbumsViewProps {
  eventId: string
}

export function PersonAlbumsView({ eventId }: PersonAlbumsViewProps) {
  const [ranking, setRanking] = useState<FaceAlbumEntry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [photosLoading, setPhotosLoading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const loadRanking = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchFaceAlbumRanking(eventId)
      setRanking(data)
      setSelectedId((prev) => prev ?? data[0]?.id ?? null)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void loadRanking()
  }, [loadRanking])

  useEffect(() => {
    if (!selectedId) {
      setPhotos([])
      return
    }
    let cancelled = false
    void (async () => {
      setPhotosLoading(true)
      try {
        const data = await fetchPhotosForFace(selectedId, eventId)
        if (!cancelled) setPhotos(data)
      } finally {
        if (!cancelled) setPhotosLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId, eventId])

  const selected = ranking.find((f) => f.id === selectedId)
  const maxCount = ranking.length > 0 ? Math.max(...ranking.map((f) => f.photoCount), 1) : 1
  const leader = ranking[0]

  if (loading) {
    return <p className="py-10 text-center ev-text-muted">Carregando álbuns…</p>
  }

  if (ranking.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-4xl">👤</p>
        <p className="mt-3 ev-text-muted">Nenhum rosto cadastrado ainda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {leader && ranking.length > 1 && (
        <div className="rounded-2xl border ev-border-accent-soft ev-bg-primary-soft p-4 text-center">
          <p className="text-sm ev-text-muted">Quem aparece mais?</p>
          <p className="mt-1 text-lg font-bold ev-text">
            🏆 {leader.name} — {leader.photoCount} foto{leader.photoCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <section className="ev-surface rounded-2xl p-4">
        <h3 className="mb-3 text-sm font-semibold ev-text">Ranking</h3>
        <ul className="space-y-3">
          {ranking.map((face, index) => (
            <li key={face.id}>
              <button
                type="button"
                onClick={() => setSelectedId(face.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  selectedId === face.id ? 'ev-border-accent ev-bg-primary-soft' : 'ev-border-subtle'
                }`}
              >
                <span className="w-5 text-xs font-bold ev-text-muted">{index + 1}º</span>
                <img
                  src={face.reference_image_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium ev-text">{face.name}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full ev-bg-primary"
                      style={{ width: `${(face.photoCount / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold ev-text-accent-strong">
                  {face.photoCount}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selected && (
        <section>
          <h3 className="mb-3 text-sm font-semibold ev-text">
            Fotos de {selected.name} ({selected.photoCount})
          </h3>
          {photosLoading ? (
            <p className="py-8 text-center ev-text-muted">Carregando fotos…</p>
          ) : photos.length === 0 ? (
            <p className="py-8 text-center ev-text-muted">
              Nenhuma foto identificada ainda. Novas fotos serão analisadas automaticamente.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setLightboxIndex(index)}
                  className="relative aspect-square overflow-hidden rounded-lg ev-surface-soft"
                >
                  <img
                    src={photo.image_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {lightboxIndex !== null && (
        <MediaLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  )
}
