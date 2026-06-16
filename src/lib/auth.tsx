import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from './supabase'
import type { User } from './types'

const STORAGE_KEY = 'event-photo-feed:user'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

/** Remove a senha antes de guardar no estado/localStorage. */
function stripPassword(row: User & { password?: string }): User {
  return { id: row.id, username: row.username, created_at: row.created_at }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

/**
 * Entra com username + senha simples.
 * - Se o username já existe: a senha precisa bater, senão dá erro.
 * - Se não existe: cria o usuário com essa senha.
 * Assim, nomes iguais não viram pessoas diferentes.
 */
/** Exige nome e sobrenome: ao menos duas palavras com 2+ letras cada. */
function validateFullName(name: string): void {
  const parts = name.split(/\s+/).filter((p) => p.length >= 2)
  if (parts.length < 2) {
    throw new Error('Use nome e sobrenome (ex.: João Silva).')
  }
}

async function loginOrRegister(rawUsername: string, password: string): Promise<User> {
  const username = rawUsername.trim().replace(/\s+/g, ' ')
  if (!username) throw new Error('Digite um nome de usuário.')
  validateFullName(username)
  if (!password) throw new Error('Digite uma senha.')

  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select('id, username, password, created_at')
    .ilike('username', username)
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
    .insert({ username, password })
    .select('id, username, password, created_at')
    .single()

  if (insertError) {
    // Username único: se alguém criou no meio do caminho, validamos a senha.
    const { data: retry } = await supabase
      .from('users')
      .select('id, username, password, created_at')
      .ilike('username', username)
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())
  const [loading, setLoading] = useState(false)

  // Revalida o usuário salvo contra o banco ao abrir o app.
  useEffect(() => {
    const stored = readStoredUser()
    if (!stored) return
    let cancelled = false
    void (async () => {
      const { data } = await supabase
        .from('users')
        .select('id, username, created_at')
        .eq('id', stored.id)
        .maybeSingle()
      if (cancelled) return
      if (data) {
        const u = data as User
        setUser(u)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    try {
      const u = await loginOrRegister(username, password)
      setUser(u)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.')
  return ctx
}
