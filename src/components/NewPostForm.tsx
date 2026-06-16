import { useRef, useState, type ChangeEvent } from 'react'
import { PHOTOS_BUCKET, supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface NewPostFormProps {
  onPosted: () => void
}

function fileExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : 'jpg'
}

export function NewPostForm({ onPosted }: NewPostFormProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setError(null)
    setFile(selected)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return selected ? URL.createObjectURL(selected) : null
    })
  }

  function reset() {
    setFile(null)
    setCaption('')
    setError(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handlePost() {
    if (!file || !user) return
    setUploading(true)
    setError(null)
    try {
      const ext = fileExtension(file.name)
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          contentType: file.type || undefined,
          upsert: false,
        })
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path)

      const { error: insertError } = await supabase.from('photos').insert({
        user_id: user.id,
        image_url: publicUrl,
        image_path: path,
        caption: caption.trim() || null,
      })
      if (insertError) {
        // Limpa o arquivo órfão se o registro falhar.
        await supabase.storage.from(PHOTOS_BUCKET).remove([path])
        throw insertError
      }

      reset()
      onPosted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao postar a foto.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      {previewUrl ? (
        <div className="space-y-3">
          <img
            src={previewUrl}
            alt="Pré-visualização"
            className="max-h-80 w-full rounded-xl object-cover"
          />
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Escreva uma legenda (opcional)"
            maxLength={280}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-fuchsia-400"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handlePost}
              disabled={uploading}
              className="flex-1 rounded-xl bg-fuchsia-500 px-4 py-2.5 font-semibold text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
            >
              {uploading ? 'Enviando…' : 'Postar'}
            </button>
            <button
              onClick={reset}
              disabled={uploading}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-zinc-300 transition hover:text-white disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 px-4 py-6 text-zinc-300 transition hover:border-fuchsia-400/60 hover:text-white"
        >
          <span className="text-2xl">📷</span>
          <span className="font-medium">Tirar / escolher foto</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
