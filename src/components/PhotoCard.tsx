import { useMemo, useState, type FormEvent } from 'react'
import { PHOTOS_BUCKET, supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Comment, Photo } from '../lib/types'

interface PhotoCardProps {
  photo: Photo
  onDeleted: (photoId: string) => void
  onMediaClick?: () => void
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  const d = Math.floor(h / 24)
  return `${d} d`
}

export function PhotoCard({ photo, onDeleted, onMediaClick }: PhotoCardProps) {
  const { user } = useAuth()

  const [likes, setLikes] = useState(photo.likes)
  const [comments, setComments] = useState<Comment[]>(
    [...photo.comments].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ),
  )
  const [commentText, setCommentText] = useState('')
  const [busyLike, setBusyLike] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = user?.id === photo.user_id
  const liked = useMemo(() => likes.some((l) => l.user_id === user?.id), [likes, user])

  async function toggleLike() {
    if (!user || busyLike) return
    setBusyLike(true)
    const wasLiked = liked
    setLikes((prev) =>
      wasLiked ? prev.filter((l) => l.user_id !== user.id) : [...prev, { user_id: user.id }],
    )
    try {
      if (wasLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('photo_id', photo.id)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ photo_id: photo.id, user_id: user.id })
        if (error) throw error
      }
    } catch {
      setLikes((prev) =>
        wasLiked ? [...prev, { user_id: user.id }] : prev.filter((l) => l.user_id !== user.id),
      )
    } finally {
      setBusyLike(false)
    }
  }

  async function addComment(e: FormEvent) {
    e.preventDefault()
    const text = commentText.trim()
    if (!user || !text) return
    setCommentText('')
    const { data, error } = await supabase
      .from('comments')
      .insert({ photo_id: photo.id, user_id: user.id, text })
      .select('*, user:users(id, username)')
      .single()
    if (error) {
      setCommentText(text)
      return
    }
    setComments((prev) => [...prev, data as Comment])
  }

  async function handleDelete() {
    if (!isOwner || deleting) return
    if (!confirm('Apagar esta foto?')) return
    setDeleting(true)
    try {
      if (photo.image_path) {
        await supabase.storage.from(PHOTOS_BUCKET).remove([photo.image_path])
      }
      const { error } = await supabase.from('photos').delete().eq('id', photo.id)
      if (error) throw error
      onDeleted(photo.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <article className="ev-surface overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold uppercase ev-bg-primary-soft ev-text-accent-strong">
            {photo.user?.username?.[0] ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold ev-text">
              {photo.user?.username ?? 'anônimo'}
            </p>
            <p className="text-xs ev-text-muted">{timeAgo(photo.created_at)}</p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="ev-btn-ghost rounded-lg px-2 py-1 text-sm transition hover:text-red-500 disabled:opacity-50"
            aria-label="Apagar foto"
          >
            {deleting ? '…' : '🗑️'}
          </button>
        )}
      </div>

      {photo.media_type === 'video' ? (
        <video
          src={photo.image_url}
          controls
          playsInline
          preload="metadata"
          className="w-full cursor-pointer bg-black"
          onClick={onMediaClick}
        />
      ) : (
        <button type="button" onClick={onMediaClick} className="block w-full">
          <img
            src={photo.image_url}
            alt={photo.caption ?? 'Foto do evento'}
            loading="lazy"
            className="w-full bg-black object-cover"
          />
        </button>
      )}

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLike}
            disabled={busyLike}
            className="flex items-center gap-1.5 text-sm font-medium transition disabled:opacity-50 ev-text"
          >
            <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
            <span>{likes.length}</span>
          </button>
          <span className="flex items-center gap-1.5 text-sm ev-text-muted">
            <span className="text-lg">💬</span>
            {comments.length}
          </span>
        </div>

        {photo.caption && (
          <p className="mt-2 text-sm ev-text">
            <span className="font-semibold">{photo.user?.username}</span> {photo.caption}
          </p>
        )}

        {comments.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {comments.map((c) => (
              <li key={c.id} className="text-sm ev-text-muted">
                <span className="font-semibold ev-text">{c.user?.username ?? 'anônimo'}</span>{' '}
                {c.text}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addComment} className="mt-3 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Comentar…"
            maxLength={280}
            className="ev-input ev-focus flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-40 ev-bg-primary ev-bg-primary-hover"
          >
            Enviar
          </button>
        </form>
      </div>
    </article>
  )
}
