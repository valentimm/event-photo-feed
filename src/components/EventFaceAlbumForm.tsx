import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  createEventFace,
  deleteEventFace,
  fetchFaceAlbumRanking,
  reprocessAllEventFaceMatches,
  updateFaceAlbumSettings,
  uploadEventFaceReference,
} from '../lib/events'
import { descriptorToArray, extractPrimaryFaceDescriptor } from '../lib/faceRecognition'
import type { Event, FaceAlbumEntry } from '../lib/types'

interface EventFaceAlbumFormProps {
  event: Event
  onUpdated: (event: Event) => void
}

function extFromFile(file: File): string {
  const idx = file.name.lastIndexOf('.')
  return idx >= 0 ? file.name.slice(idx + 1).toLowerCase() : 'jpg'
}

export function EventFaceAlbumForm({ event, onUpdated }: EventFaceAlbumFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [enabled, setEnabled] = useState(event.face_album_enabled ?? false)
  const [faces, setFaces] = useState<FaceAlbumEntry[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [reprocessing, setReprocessing] = useState(false)
  const [reprocessProgress, setReprocessProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadFaces() {
    setLoading(true)
    try {
      const ranking = await fetchFaceAlbumRanking(event.id)
      setFaces(ranking)
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
      const updated = await updateFaceAlbumSettings(event.id, enabled)
      onUpdated(updated)
      setSuccess('Configuração de álbuns faciais salva!')
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
    setAdding(true)
    setError(null)
    setSuccess(null)
    try {
      const previewUrl = URL.createObjectURL(file)
      const descriptor = await extractPrimaryFaceDescriptor(previewUrl)
      URL.revokeObjectURL(previewUrl)

      if (!descriptor) {
        throw new Error('Nenhum rosto detectado. Use uma foto com o rosto bem visível.')
      }

      const ext = extFromFile(file)
      const { publicUrl, path } = await uploadEventFaceReference(event.id, file, ext)
      const created = await createEventFace({
        eventId: event.id,
        name: name.trim(),
        referenceImageUrl: publicUrl,
        referenceImagePath: path,
        descriptor: descriptorToArray(descriptor),
      })
      setFaces((prev) => [...prev, { ...created, photoCount: 0 }])
      setName('')
      if (fileRef.current) fileRef.current.value = ''
      setSuccess(`${created.name} cadastrado(a)!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar rosto.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(face: FaceAlbumEntry) {
    if (!confirm(`Remover ${face.name} e todas as associações?`)) return
    setRemoving(face.id)
    setError(null)
    try {
      await deleteEventFace(face)
      setFaces((prev) => prev.filter((f) => f.id !== face.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.')
    } finally {
      setRemoving(null)
    }
  }

  async function handleReprocess() {
    if (faces.length === 0) return
    setReprocessing(true)
    setReprocessProgress(null)
    setError(null)
    try {
      await reprocessAllEventFaceMatches(event.id, (current, total) => {
        setReprocessProgress(`${current}/${total}`)
      })
      await loadFaces()
      setSuccess('Todas as fotos foram reanalisadas!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reprocessar fotos.')
    } finally {
      setReprocessing(false)
      setReprocessProgress(null)
    }
  }

  const maxCount = faces.length > 0 ? Math.max(...faces.map((f) => f.photoCount), 1) : 1

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-1 font-semibold">Álbuns por rosto</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Cadastre rostos (ex.: noivo, noiva) para agrupar fotos automaticamente e ver quem
        aparece mais.
      </p>

      <form onSubmit={handleSaveSettings} className="space-y-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm">Habilitar álbuns por pessoa neste evento</span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold hover:bg-fuchsia-500 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar configuração'}
        </button>
      </form>

      {success && <p className="mt-3 text-sm text-emerald-400">{success}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {enabled && (
        <div className="mt-6 space-y-5 border-t border-white/10 pt-5">
          <div>
            <h3 className="mb-3 text-sm font-medium text-zinc-300">Cadastrar pessoa</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome (ex.: Noiva)"
                maxLength={80}
                className="flex-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-500/50"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={adding || !name.trim()}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                {adding ? 'Analisando rosto…' : '📷 Foto de referência'}
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
              Use uma foto com apenas um rosto bem visível de frente.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-500">Carregando…</p>
          ) : faces.length > 0 ? (
            <>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-zinc-300">Ranking de aparições</h3>
                  <button
                    type="button"
                    onClick={() => void handleReprocess()}
                    disabled={reprocessing}
                    className="text-xs text-zinc-400 hover:text-white disabled:opacity-50"
                  >
                    {reprocessing
                      ? `Reanalisando ${reprocessProgress ?? '…'}`
                      : '↻ Reanalisar todas as fotos'}
                  </button>
                </div>
                <ul className="space-y-3">
                  {faces.map((face, index) => (
                    <li
                      key={face.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-zinc-900/50 p-3"
                    >
                      <span className="w-6 text-center text-sm font-bold text-zinc-500">
                        {index + 1}º
                      </span>
                      <img
                        src={face.reference_image_url}
                        alt={face.name}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{face.name}</p>
                        <p className="text-xs text-zinc-400">
                          {face.photoCount} foto{face.photoCount !== 1 ? 's' : ''}
                        </p>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-fuchsia-500 transition-all"
                            style={{ width: `${(face.photoCount / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRemove(face)}
                        disabled={removing === face.id}
                        className="shrink-0 text-zinc-500 hover:text-red-400 disabled:opacity-50"
                        aria-label={`Remover ${face.name}`}
                      >
                        {removing === face.id ? '…' : '✕'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Nenhum rosto cadastrado ainda.</p>
          )}
        </div>
      )}
    </section>
  )
}
