import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  createEventFeedPeekFace,
  deleteEventFeedPeekFace,
  fetchEventFeedPeekFaces,
  updateFeedPeekFacesSettings,
  uploadFeedPeekFaceImage,
} from '../lib/events'
import { cropPrimaryFaceFromImage } from '../lib/faceRecognition'
import type { Event, EventFeedPeekFace } from '../lib/types'

interface EventFeedPeekFacesFormProps {
  event: Event
  onUpdated: (event: Event) => void
}

const MAX_FACES = 8

export function EventFeedPeekFacesForm({ event, onUpdated }: EventFeedPeekFacesFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [enabled, setEnabled] = useState(event.feed_peek_faces_enabled ?? false)
  const [faces, setFaces] = useState<EventFeedPeekFace[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadFaces() {
    setLoading(true)
    try {
      const list = await fetchEventFeedPeekFaces(event.id)
      setFaces(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar rostos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFaces()
  }, [event.id])

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await updateFeedPeekFacesSettings(event.id, enabled)
      onUpdated(updated)
      setSuccess('Configuração de rostos no feed salva!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !name.trim()) {
      if (!name.trim()) setError('Digite o nome antes de escolher a foto.')
      return
    }
    if (faces.length >= MAX_FACES) {
      setError(`Máximo de ${MAX_FACES} rostos.`)
      return
    }

    setAdding(true)
    setError(null)
    setSuccess(null)
    try {
      const cropped = await cropPrimaryFaceFromImage(file)
      const { publicUrl, path } = await uploadFeedPeekFaceImage(event.id, cropped)
      const created = await createEventFeedPeekFace({
        eventId: event.id,
        name: name.trim(),
        imageUrl: publicUrl,
        imagePath: path,
        sortOrder: faces.length,
      })
      setFaces((prev) => [...prev, created])
      setName('')
      if (fileRef.current) fileRef.current.value = ''
      setSuccess(`${created.name} adicionado(a)! O rosto foi recortado automaticamente.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar rosto.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(face: EventFeedPeekFace) {
    if (!confirm(`Remover ${face.name}?`)) return
    setRemoving(face.id)
    setError(null)
    try {
      await deleteEventFeedPeekFace(face)
      setFaces((prev) => prev.filter((f) => f.id !== face.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-1 font-semibold">Rostos espiando no feed</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Adicione fotos de rosto (ex.: noivo, noiva) que vão aparecer espiando por trás dos cards
        enquanto os convidados rolam o feed. Fotos de corpo inteiro são recortadas automaticamente.
      </p>

      <form onSubmit={handleSaveSettings} className="space-y-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm">Habilitar rostos espiando neste evento</span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar configuração'}
        </button>
      </form>

      {success && <p className="mt-3 text-sm text-emerald-400">{success}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {enabled && (
        <div className="mt-6 space-y-5 border-t border-white/10 pt-5">
          <div>
            <h3 className="mb-3 text-sm font-medium text-zinc-300">Adicionar rosto</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome (ex.: Noivo)"
                maxLength={80}
                className="flex-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-violet-500/50"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={adding || !name.trim() || faces.length >= MAX_FACES}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                {adding ? 'Recortando rosto…' : '📷 Escolher foto'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Pode ser foto de rosto ou corpo inteiro — detectamos e recortamos o rosto sozinhos.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-500">Carregando…</p>
          ) : faces.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {faces.map((face) => (
                <li
                  key={face.id}
                  className="relative flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-zinc-900/50 p-3"
                >
                  <div className="relative">
                    <img
                      src={face.image_url}
                      alt={face.name}
                      className="h-16 w-16 rounded-full border-2 border-violet-500/40 object-cover"
                    />
                    <span className="feed-peek-preview absolute -right-1 -top-1 text-lg" aria-hidden>
                      👀
                    </span>
                  </div>
                  <p className="truncate text-center text-sm font-medium">{face.name}</p>
                  <button
                    type="button"
                    onClick={() => void handleRemove(face)}
                    disabled={removing === face.id}
                    className="text-xs text-zinc-500 hover:text-red-400 disabled:opacity-50"
                  >
                    {removing === face.id ? '…' : 'Remover'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nenhum rosto cadastrado ainda.</p>
          )}
        </div>
      )}
    </section>
  )
}
