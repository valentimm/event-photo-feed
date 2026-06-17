import type { CSSProperties } from 'react'
import type { Event } from './types'

export interface EventTheme {
  color_background: string
  color_text: string
  color_text_muted: string
  color_primary: string
  color_accent: string
  color_gradient_start: string
  color_gradient_end: string
  logo_url: string | null
}

/** Tema escuro padrão do app. */
export const DEFAULT_EVENT_THEME: EventTheme = {
  color_background: '#09090b',
  color_text: '#ffffff',
  color_text_muted: '#a1a1aa',
  color_primary: '#d946ef',
  color_accent: '#e879f9',
  color_gradient_start: '#701a75',
  color_gradient_end: '#312e81',
  logo_url: null,
}

/** Preset inspirado em convites claros (creme, marrom, verde). */
export const LIGHT_INVITE_PRESET: Omit<EventTheme, 'logo_url'> = {
  color_background: '#f9f7f2',
  color_text: '#2d2926',
  color_text_muted: '#a68b67',
  color_primary: '#4a5d4e',
  color_accent: '#a68b67',
  color_gradient_start: '#f5f0e8',
  color_gradient_end: '#f9f7f2',
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
    color_background: normalizeHexColor(
      event.color_background ?? DEFAULT_EVENT_THEME.color_background,
      DEFAULT_EVENT_THEME.color_background,
    ),
    color_text: normalizeHexColor(
      event.color_text ?? DEFAULT_EVENT_THEME.color_text,
      DEFAULT_EVENT_THEME.color_text,
    ),
    color_text_muted: normalizeHexColor(
      event.color_text_muted ?? DEFAULT_EVENT_THEME.color_text_muted,
      DEFAULT_EVENT_THEME.color_text_muted,
    ),
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
    ['--ev-background' as string]: theme.color_background,
    ['--ev-text' as string]: theme.color_text,
    ['--ev-text-muted' as string]: theme.color_text_muted,
    ['--ev-primary' as string]: theme.color_primary,
    ['--ev-accent' as string]: theme.color_accent,
    ['--ev-gradient-start' as string]: theme.color_gradient_start,
    ['--ev-gradient-end' as string]: theme.color_gradient_end,
  }
}

export const THEME_COLOR_FIELDS = [
  { key: 'color_background' as const, label: 'Fundo da página', hint: 'Cor de fundo geral (ex.: creme #f9f7f2)' },
  { key: 'color_text' as const, label: 'Texto principal', hint: 'Títulos e textos em destaque' },
  { key: 'color_text_muted' as const, label: 'Texto secundário', hint: 'Legendas, datas e detalhes' },
  { key: 'color_primary' as const, label: 'Cor principal', hint: 'Botões e destaques' },
  { key: 'color_accent' as const, label: 'Cor de acento', hint: 'Hover, labels e bordas' },
  { key: 'color_gradient_start' as const, label: 'Gradiente (início)', hint: 'Tom suave no topo da tela de entrada' },
  { key: 'color_gradient_end' as const, label: 'Gradiente (fim)', hint: 'Tom suave na base (geralmente igual ao fundo)' },
]
