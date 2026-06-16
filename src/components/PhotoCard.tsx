import { useMemo, useState, type FormEvent } from 'react'
import { PHOTOS_BUCKET, supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Comment, Photo } from '../lib/types'

interface PhotoCardProps {
  photo: Photo
  onDeleted: (photoId: string) => void
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

export function PhotoCard({ photo, onDeleted }: PhotoCardProps) {
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
    // Otimista
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
      // Reverte em caso de erro
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
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-500/20 text-sm font-bold uppercase text-fuchsia-300">
            {photo.user?.username?.[0] ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {photo.user?.username ?? 'anônimo'}
            </p>
            <p className="text-xs text-zinc-500">{timeAgo(photo.created_at)}</p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg px-2 py-1 text-sm text-zinc-400 transition hover:text-red-400 disabled:opacity-50"
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
          className="w-full bg-black"
        />
      ) : (
        <img
          src={photo.image_url}
          alt={photo.caption ?? 'Foto do evento'}
          loading="lazy"
          className="w-full bg-black object-cover"
        />
      )}

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLike}
            disabled={busyLike}
            className="flex items-center gap-1.5 text-sm font-medium transition disabled:opacity-50"
          >
            <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
            <span className="text-zinc-300">{likes.length}</span>
          </button>
          <span className="flex items-center gap-1.5 text-sm text-zinc-400">
            <span className="text-lg">💬</span>
            {comments.length}
          </span>
        </div>

        {photo.caption && (
          <p className="mt-2 text-sm text-zinc-200">
            <span className="font-semibold text-white">{photo.user?.username}</span>{' '}
            {photo.caption}
          </p>
        )}

        {comments.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {comments.map((c) => (
              <li key={c.id} className="text-sm text-zinc-300">
                <span className="font-semibold text-white">
                  {c.user?.username ?? 'anônimo'}
                </span>{' '}
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
            className="flex-1 rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-fuchsia-400"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="rounded-lg bg-fuchsia-500/90 px-3 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:opacity-40"
          >
            Enviar
          </button>
        </form>
      </div>
    </article>
  )
}
