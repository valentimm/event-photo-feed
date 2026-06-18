import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { PHOTOS_BUCKET, supabase } from '../lib/supabase'
import { matchPhotoToRegisteredFaces } from '../lib/events'
import { useAuth } from '../lib/auth'
import type { MediaType } from '../lib/types'
import { VideoPlayOverlay } from './VideoPlayOverlay'

interface NewPostFormProps {
  eventId: string
  faceAlbumEnabled?: boolean
  onPosted: () => void
}

interface PickedMedia {
  blob: Blob
  ext: string
  previewUrl: string
  mediaType: MediaType
}

const isNative = Capacitor.isNativePlatform()
const MAX_VIDEO_SECONDS = 20

function extFromMime(mime: string): string {
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('heic')) return 'heic'
  if (mime.includes('quicktime') || mime.includes('mov')) return 'mov'
  if (mime.includes('mp4')) return 'mp4'
  if (mime.includes('webm')) return 'webm'
  return 'jpg'
}

function extFromName(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : 'jpg'
}

function getVideoDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => resolve(video.duration)
    video.onerror = () => reject(new Error('Não foi possível ler o vídeo.'))
    video.src = url
  })
}

function VideoPreview({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={src}
        playsInline
        className="max-h-80 w-full cursor-pointer rounded-xl bg-black"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!playing && <VideoPlayOverlay className="rounded-xl" />}
    </div>
  )
}

export function NewPostForm({ eventId, faceAlbumEnabled, onPosted }: NewPostFormProps) {
  const { user } = useAuth()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [media, setMedia] = useState<PickedMedia | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (media) URL.revokeObjectURL(media.previewUrl)
    }
  }, [media])

  function setPicked(next: PickedMedia | null) {
    setMedia((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return next
    })
  }

  /** Foto pela câmera/galeria nativa (iOS/Android) via Capacitor. */
  async function pickNativePhoto(source: CameraSource) {
    setError(null)
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source,
      })
      if (!photo.webPath) throw new Error('Não foi possível obter a foto.')
      const res = await fetch(photo.webPath)
      const blob = await res.blob()
      setPicked({
        blob,
        ext: photo.format || extFromMime(blob.type),
        previewUrl: URL.createObjectURL(blob),
        mediaType: 'image',
      })
    } catch (err) {
      if (err instanceof Error && /cancel/i.test(err.message)) return
      setError(err instanceof Error ? err.message : 'Falha ao abrir a câmera.')
    }
  }

  function handlePhotoFile(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setError(null)
    setPicked(
      selected
        ? {
            blob: selected,
            ext: extFromName(selected.name),
            previewUrl: URL.createObjectURL(selected),
            mediaType: 'image',
          }
        : null,
    )
  }

  async function handleVideoFile(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setError(null)
    if (!selected) return

    const url = URL.createObjectURL(selected)
    try {
      const duration = await getVideoDuration(url)
      if (duration > MAX_VIDEO_SECONDS + 0.5) {
        URL.revokeObjectURL(url)
        setError(
          `O vídeo tem ${Math.round(duration)}s. O limite é de ${MAX_VIDEO_SECONDS} segundos.`,
        )
        if (videoInputRef.current) videoInputRef.current.value = ''
        return
      }
      setPicked({
        blob: selected,
        ext: extFromName(selected.name) || extFromMime(selected.type),
        previewUrl: url,
        mediaType: 'video',
      })
    } catch (err) {
      URL.revokeObjectURL(url)
      setError(err instanceof Error ? err.message : 'Falha ao ler o vídeo.')
    }
  }

  function reset() {
    setPicked(null)
    setCaption('')
    setError(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  async function handlePost() {
    if (!media || !user) return
    setUploading(true)
    setError(null)
    try {
      const path = `${eventId}/${user.id}/${crypto.randomUUID()}.${media.ext}`

      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(path, media.blob, {
          cacheControl: '3600',
          contentType: media.blob.type || `${media.mediaType}/${media.ext}`,
          upsert: false,
        })
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path)

      const { data: inserted, error: insertError } = await supabase
        .from('photos')
        .insert({
          event_id: eventId,
          user_id: user.id,
          image_url: publicUrl,
          image_path: path,
          media_type: media.mediaType,
          caption: caption.trim() || null,
        })
        .select('id')
        .single()
      if (insertError) {
        await supabase.storage.from(PHOTOS_BUCKET).remove([path])
        throw insertError
      }

      if (faceAlbumEnabled && media.mediaType === 'image' && inserted?.id) {
        void matchPhotoToRegisteredFaces(inserted.id, publicUrl, eventId).catch(() => {})
      }

      reset()
      onPosted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao postar.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="ev-surface rounded-2xl p-4">
      {media ? (
        <div className="space-y-3">
          {media.mediaType === 'video' ? (
            <VideoPreview src={media.previewUrl} />
          ) : (
            <img
              src={media.previewUrl}
              alt="Pré-visualização"
              className="max-h-80 w-full rounded-xl object-cover"
            />
          )}
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Escreva uma legenda (opcional)"
            maxLength={280}
            className="ev-input ev-focus w-full rounded-xl px-4 py-2.5 outline-none"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handlePost}
              disabled={uploading}
              className="flex-1 rounded-xl px-4 py-2.5 font-semibold transition disabled:opacity-50 ev-bg-primary ev-bg-primary-hover"
            >
              {uploading ? 'Enviando…' : 'Postar'}
            </button>
            <button
              onClick={reset}
              disabled={uploading}
              className="ev-btn-ghost rounded-xl px-4 py-2.5 transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            {isNative ? (
              <>
                <button
                  onClick={() => pickNativePhoto(CameraSource.Camera)}
                  className="ev-btn-ghost flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed ev-border-subtle px-3 py-5 transition hover:ev-border-accent"
                >
                  <span className="text-2xl">📷</span>
                  <span className="text-sm font-medium">Câmera</span>
                </button>
                <button
                  onClick={() => pickNativePhoto(CameraSource.Photos)}
                  className="ev-btn-ghost flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed ev-border-subtle px-3 py-5 transition hover:ev-border-accent"
                >
                  <span className="text-2xl">🖼️</span>
                  <span className="text-sm font-medium">Galeria</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="ev-btn-ghost flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed ev-border-subtle px-3 py-5 transition hover:ev-border-accent"
              >
                <span className="text-2xl">📷</span>
                <span className="text-sm font-medium">Foto</span>
              </button>
            )}
            <button
              onClick={() => videoInputRef.current?.click()}
              className="ev-btn-ghost flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed ev-border-subtle px-3 py-5 transition hover:ev-border-accent"
            >
              <span className="text-2xl">🎥</span>
              <span className="text-sm font-medium">Vídeo</span>
            </button>
          </div>
          <p className="text-center text-xs ev-text-muted">
            Vídeo de até {MAX_VIDEO_SECONDS} segundos.
          </p>
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
        </div>
      )}

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoFile}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={handleVideoFile}
      />
    </div>
  )
}
