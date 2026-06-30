import { useCallback, useEffect, useState } from 'react'
import { fetchEventFeedPeekFaces } from '../lib/events'
import { supabase } from '../lib/supabase'
import { groupPhotosByDay } from '../lib/format'
import type { Event, EventFeedPeekFace, Photo } from '../lib/types'
import { FeedCardsList, TimelineCardsList } from './FeedCardsList'
import { MediaLightbox } from './MediaLightbox'
import { NewPostForm } from './NewPostForm'
import { PersonAlbumsView } from './PersonAlbumsView'
import { VideoPlayOverlay } from './VideoPlayOverlay'

const PHOTO_QUERY =
  '*, user:users(id, username), likes(user_id), comments(*, user:users(id, username))'

type ViewMode = 'feed' | 'grid' | 'timeline' | 'people'

interface FeedProps {
  event: Event
}

export function Feed({ event }: FeedProps) {
  const eventId = event.id
  const faceAlbumEnabled = event.face_album_enabled ?? false
  const peekFacesEnabled = event.feed_peek_faces_enabled ?? false
  const [photos, setPhotos] = useState<Photo[]>([])
  const [peekFaces, setPeekFaces] = useState<EventFeedPeekFace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>('feed')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const loadPhotos = useCallback(async () => {
    setError(null)
    const { data, error: queryError } = await supabase
      .from('photos')
      .select(PHOTO_QUERY)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
    } else {
      setPhotos((data as Photo[]) ?? [])
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    void loadPhotos()
  }, [loadPhotos])

  useEffect(() => {
    if (!peekFacesEnabled) {
      setPeekFaces([])
      return
    }
    let cancelled = false
    void fetchEventFeedPeekFaces(eventId)
      .then((faces) => {
        if (!cancelled) setPeekFaces(faces)
      })
      .catch(() => {
        if (!cancelled) setPeekFaces([])
      })
    return () => {
      cancelled = true
    }
  }, [eventId, peekFacesEnabled])

  // Atualização em tempo real (estilo Dots — feed vivo durante o evento)
  useEffect(() => {
    const channel = supabase
      .channel(`event-photos-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photos', filter: `event_id=eq.${eventId}` },
        () => {
          void loadPhotos()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [eventId, loadPhotos])

  const handleDeleted = useCallback((photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    setLightboxIndex(null)
  }, [])

  const openLightbox = useCallback((photoId: string) => {
    const idx = photos.findIndex((p) => p.id === photoId)
    if (idx >= 0) setLightboxIndex(idx)
  }, [photos])

  const timelineGroups = groupPhotosByDay(photos)
  const activePeekFaces = peekFacesEnabled ? peekFaces : []

  return (
    <main className="feed-peek-root mx-auto max-w-xl space-y-4 px-4 py-5">
      <NewPostForm
        eventId={eventId}
        faceAlbumEnabled={faceAlbumEnabled}
        onPosted={loadPhotos}
      />

      {!loading && (photos.length > 0 || faceAlbumEnabled) && (
        <div className="flex rounded-xl ev-surface p-1">
          {(
            [
              { id: 'feed' as const, label: 'Feed', icon: '📋' },
              { id: 'grid' as const, label: 'Galeria', icon: '🖼️' },
              { id: 'timeline' as const, label: 'Linha do tempo', icon: '📅' },
              ...(faceAlbumEnabled
                ? [{ id: 'people' as const, label: 'Pessoas', icon: '👤' }]
                : []),
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              onClick={() => setView(mode.id)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition sm:text-sm ${
                view === mode.id ? 'ev-view-active' : 'ev-view-inactive'
              }`}
            >
              <span>{mode.icon}</span>
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>
      )}

      {loading && <p className="py-10 text-center ev-text-muted">Carregando memórias…</p>}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Erro ao carregar: {error}
        </div>
      )}

      {!loading && !error && photos.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-4xl">📷</p>
          <p className="mt-3 ev-text-muted">Nenhuma memória ainda.</p>
          <p className="mt-1 text-sm ev-text-muted">Seja o primeiro a compartilhar!</p>
        </div>
      )}

      {view === 'feed' && (
        <FeedCardsList
          photos={photos}
          peekFaces={activePeekFaces}
          onDeleted={handleDeleted}
          onMediaClick={openLightbox}
        />
      )}

      {view === 'grid' && photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => openLightbox(photo.id)}
              className="relative aspect-square overflow-hidden rounded-lg ev-surface-soft"
            >
              {photo.media_type === 'video' ? (
                <>
                  <video
                    src={photo.image_url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <VideoPlayOverlay />
                </>
              ) : (
                <img
                  src={photo.image_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {view === 'timeline' && (
        <TimelineCardsList
          groups={timelineGroups}
          peekFaces={activePeekFaces}
          onDeleted={handleDeleted}
          onMediaClick={openLightbox}
        />
      )}

      {view === 'people' && faceAlbumEnabled && <PersonAlbumsView eventId={eventId} />}

      {lightboxIndex !== null && (
        <MediaLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </main>
  )
}
