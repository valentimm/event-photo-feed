export type EventType =
  | 'wedding'
  | 'birthday'
  | 'party'
  | 'corporate'
  | 'travel'
  | 'other'

export const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: 'wedding', label: 'Casamento', emoji: '💒' },
  { value: 'birthday', label: 'Aniversário', emoji: '🎂' },
  { value: 'party', label: 'Festa', emoji: '🎉' },
  { value: 'corporate', label: 'Corporativo', emoji: '💼' },
  { value: 'travel', label: 'Viagem', emoji: '✈️' },
  { value: 'other', label: 'Outro', emoji: '📸' },
]

export function getEventTypeInfo(type: string) {
  return EVENT_TYPES.find((t) => t.value === type) ?? EVENT_TYPES[EVENT_TYPES.length - 1]
}
