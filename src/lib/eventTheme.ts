import type { CSSProperties } from 'react'
import type { Event } from './types'

/** Mesmas 4 cores do tema padrão (fuchsia + indigo). */
export interface EventTheme {
  color_primary: string
  color_accent: string
  color_gradient_start: string
  color_gradient_end: string
  logo_url: string | null
}

export const DEFAULT_EVENT_THEME: EventTheme = {
  color_primary: '#d946ef',
  color_accent: '#e879f9',
  color_gradient_start: '#701a75',
  color_gradient_end: '#312e81',
  logo_url: null,
}

const HEX = /^#[0-9A-Fa-f]{6}$/

export function normalizeHexColor(value: string, fallback: string): string {
  const v = value.trim()
  if (HEX.test(v)) return v.toLowerCase()
  if (HEX.test(`#${v}`)) return `#${v}`.toLowerCase()
  return fallback
}

export function themeFromEvent(event: Partial<Event>): EventTheme {
  return {
    color_primary: normalizeHexColor(
      event.color_primary ?? DEFAULT_EVENT_THEME.color_primary,
      DEFAULT_EVENT_THEME.color_primary,
    ),
    color_accent: normalizeHexColor(
      event.color_accent ?? DEFAULT_EVENT_THEME.color_accent,
      DEFAULT_EVENT_THEME.color_accent,
    ),
    color_gradient_start: normalizeHexColor(
      event.color_gradient_start ?? DEFAULT_EVENT_THEME.color_gradient_start,
      DEFAULT_EVENT_THEME.color_gradient_start,
    ),
    color_gradient_end: normalizeHexColor(
      event.color_gradient_end ?? DEFAULT_EVENT_THEME.color_gradient_end,
      DEFAULT_EVENT_THEME.color_gradient_end,
    ),
    logo_url: event.logo_url ?? null,
  }
}

export function themeCssVars(theme: EventTheme): CSSProperties {
  return {
    ['--ev-primary' as string]: theme.color_primary,
    ['--ev-accent' as string]: theme.color_accent,
    ['--ev-gradient-start' as string]: theme.color_gradient_start,
    ['--ev-gradient-end' as string]: theme.color_gradient_end,
  }
}

export const THEME_COLOR_FIELDS = [
  { key: 'color_primary' as const, label: 'Cor principal', hint: 'Botões e destaques' },
  { key: 'color_accent' as const, label: 'Cor de acento', hint: 'Hover, textos e bordas' },
  { key: 'color_gradient_start' as const, label: 'Gradiente (início)', hint: 'Topo das telas de entrada' },
  { key: 'color_gradient_end' as const, label: 'Gradiente (fim)', hint: 'Base do gradiente' },
]
