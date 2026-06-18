/** Normaliza para comparação: minúsculas, sem acentos, espaços colapsados. */
export function normalizeUsernameKey(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** Formato de exibição ao salvar (preserva acentos e capitalização digitada). */
export function normalizeUsernameDisplay(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}
