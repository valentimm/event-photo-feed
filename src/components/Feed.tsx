import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Photo } from '../lib/types'
import { NewPostForm } from './NewPostForm'
import { PhotoCard } from './PhotoCard'

const PHOTO_QUERY =
  '*, user:users(id, username), likes(user_id), comments(*, user:users(id, username))'

export function Feed() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPhotos = useCallback(async () => {
    setError(null)
    const { data, error: queryError } = await supabase
      .from('photos')
      .select(PHOTO_QUERY)
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
    } else {
      setPhotos((data as Photo[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadPhotos()
  }, [loadPhotos])

  const handleDeleted = useCallback((photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }, [])

  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-5">
      <NewPostForm onPosted={loadPhotos} />

      {loading && <p className="py-10 text-center text-zinc-500">Carregando feed…</p>}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Erro ao carregar: {error}
        </div>
      )}

      {!loading && !error && photos.length === 0 && (
        <p className="py-10 text-center text-zinc-500">
          Nenhuma foto ainda. Seja o primeiro a postar! 🎉
        </p>
      )}

      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} onDeleted={handleDeleted} />
      ))}
    </main>
  )
}
