import { supabase } from './supabase'
import { normalizeUsernameDisplay, normalizeUsernameKey } from './username'
import type { User } from './types'

/** Remove a senha antes de guardar no estado/localStorage. */
export function stripPassword(row: User & { password?: string }): User {
  return { id: row.id, username: row.username, created_at: row.created_at }
}

/** Exige nome e sobrenome: ao menos duas palavras com 2+ letras cada. */
export function validateFullName(name: string): void {
  const parts = name.split(/\s+/).filter((p) => p.length >= 2)
  if (parts.length < 2) {
    throw new Error('Use nome e sobrenome (ex.: João Silva).')
  }
}

export async function searchUsernames(query: string, limit = 8): Promise<string[]> {
  const key = normalizeUsernameKey(query)
  if (key.length < 2) return []

  const { data, error } = await supabase
    .from('users')
    .select('username')
    .ilike('username_key', `%${key}%`)
    .order('username')
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((row) => row.username as string)
}

/**
 * Entra com username + senha simples.
 * - Mesmo nome com variação de maiúsculas/acentos → mesmo usuário.
 * - Se não existe: cria o usuário com essa senha.
 */
export async function loginOrRegister(rawUsername: string, password: string): Promise<User> {
  const username = normalizeUsernameDisplay(rawUsername)
  const usernameKey = normalizeUsernameKey(rawUsername)
  if (!username) throw new Error('Digite um nome de usuário.')
  validateFullName(username)
  if (!password) throw new Error('Digite uma senha.')

  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select('id, username, password, created_at')
    .eq('username_key', usernameKey)
    .maybeSingle()

  if (selectError) throw selectError

  if (existing) {
    if (existing.password !== password) {
      throw new Error('Senha incorreta para este nome.')
    }
    return stripPassword(existing as User & { password: string })
  }

  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert({ username, username_key: usernameKey, password })
    .select('id, username, password, created_at')
    .single()

  if (insertError) {
    const { data: retry } = await supabase
      .from('users')
      .select('id, username, password, created_at')
      .eq('username_key', usernameKey)
      .maybeSingle()
    if (retry) {
      if ((retry as { password: string }).password !== password) {
        throw new Error('Senha incorreta para este nome.')
      }
      return stripPassword(retry as User & { password: string })
    }
    throw insertError
  }

  return stripPassword(created as User & { password: string })
}
