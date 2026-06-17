import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { EventThemeProvider } from './EventThemeProvider'
import { EventLogo } from './EventLogo'
import {
  DEFAULT_EVENT_THEME,
  LIGHT_INVITE_PRESET,
  THEME_COLOR_FIELDS,
  themeFromEvent,
} from '../lib/eventTheme'
import { updateEventBranding, uploadEventLogo } from '../lib/events'
import type { Event } from '../lib/types'

interface EventBrandingFormProps {
  event: Event
  onUpdated: (event: Event) => void
}

type ThemeColors = Omit<ReturnType<typeof themeFromEvent>, 'logo_url'>

export function EventBrandingForm({ event, onUpdated }: EventBrandingFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const initial = themeFromEvent(event)

  const [colors, setColors] = useState<ThemeColors>({
    color_background: initial.color_background,
    color_text: initial.color_text,
    color_text_muted: initial.color_text_muted,
    color_primary: initial.color_primary,
    color_accent: initial.color_accent,
    color_gradient_start: initial.color_gradient_start,
    color_gradient_end: initial.color_gradient_end,
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logo_url)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const previewEvent: Event = { ...event, ...colors, logo_url: logoUrl }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await updateEventBranding(event.id, { ...colors, logo_url: logoUrl })
      onUpdated(updated)
      setSuccess('Personalização salva!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const url = await uploadEventLogo(event.id, file)
      setLogoUrl(url)
      onUpdated({ ...event, ...colors, logo_url: url })
      setSuccess('Logo enviada!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar logo.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function resetColors() {
    setColors({
      color_background: DEFAULT_EVENT_THEME.color_background,
      color_text: DEFAULT_EVENT_THEME.color_text,
      color_text_muted: DEFAULT_EVENT_THEME.color_text_muted,
      color_primary: DEFAULT_EVENT_THEME.color_primary,
      color_accent: DEFAULT_EVENT_THEME.color_accent,
      color_gradient_start: DEFAULT_EVENT_THEME.color_gradient_start,
      color_gradient_end: DEFAULT_EVENT_THEME.color_gradient_end,
    })
  }

  function applyLightInvitePreset() {
    setColors({ ...LIGHT_INVITE_PRESET })
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-1 font-semibold">Personalização visual</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Cores e logo aparecem na página do evento para convidados (QR Code). Use o preset claro
        para um visual estilo convite de casamento.
      </p>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {THEME_COLOR_FIELDS.map(({ key, label, hint }) => (
            <label key={key} className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-300">{label}</span>
              <span className="mb-2 block text-xs text-zinc-500">{hint}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) => setColors((c) => ({ ...c, [key]: e.target.value }))}
                  className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-transparent"
                />
                <input
                  type="text"
                  value={colors[key]}
                  onChange={(e) => setColors((c) => ({ ...c, [key]: e.target.value }))}
                  maxLength={7}
                  className="flex-1 rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 font-mono text-sm text-white outline-none focus:border-indigo-400"
                />
              </div>
            </label>
          ))}
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-zinc-300">Logo do evento</span>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 p-2">
              <EventLogo event={previewEvent} className="max-h-full max-w-full text-3xl" />
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white disabled:opacity-50"
              >
                {uploading ? 'Enviando…' : logoUrl ? 'Trocar logo' : 'Enviar logo'}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="block text-xs text-zinc-500 hover:text-red-400"
                >
                  Remover logo (usa emoji)
                </button>
              )}
              <p className="text-xs text-zinc-500">PNG ou JPG, recomendado quadrado.</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>

        <EventThemeProvider event={previewEvent}>
          <div className="overflow-hidden rounded-xl ev-border-subtle border">
            <p className="ev-surface-soft px-3 py-2 text-xs ev-text-muted">Pré-visualização</p>
            <div className="ev-gradient-welcome px-6 py-8 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl ev-bg-primary-soft p-2">
                <EventLogo event={previewEvent} className="max-h-full max-w-full text-3xl" />
              </div>
              <p className="text-xs uppercase tracking-widest ev-text-accent">{event.name}</p>
              <h3 className="mt-2 text-xl font-bold ev-text">{event.name}</h3>
              <button
                type="button"
                className="mt-4 rounded-xl px-6 py-2 text-sm font-semibold ev-bg-primary ev-bg-primary-hover"
              >
                Participar
              </button>
            </div>
          </div>
        </EventThemeProvider>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-400">{success}</p>}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-500 px-5 py-2.5 font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar personalização'}
          </button>
          <button
            type="button"
            onClick={applyLightInvitePreset}
            className="rounded-xl border border-emerald-500/40 px-4 py-2.5 text-sm text-emerald-300 hover:bg-emerald-500/10"
          >
            Estilo convite claro
          </button>
          <button
            type="button"
            onClick={resetColors}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-400 hover:text-white"
          >
            Restaurar tema escuro
          </button>
        </div>
      </form>
    </section>
  )
}
