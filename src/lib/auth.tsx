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
  login: (username: string) => Promise<void>
  logout: () => void
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
 * Pega o usuário pelo username (case-insensitive) ou cria um novo.
 * Trata a corrida em que dois dispositivos criam o mesmo nome ao mesmo tempo.
 */
async function getOrCreateUser(rawUsername: string): Promise<User> {
  const username = rawUsername.trim()
  if (!username) throw new Error('Digite um nome de usuário.')

  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select('*')
    .ilike('username', username)
    .maybeSingle()

  if (selectError) throw selectError
  if (existing) return existing as User

  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert({ username })
    .select('*')
    .single()

  if (insertError) {
    // Username único: se alguém criou no meio do caminho, buscamos de novo.
    const { data: retry } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
      .maybeSingle()
    if (retry) return retry as User
    throw insertError
  }

  return created as User
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
        .select('*')
        .eq('id', stored.id)
        .maybeSingle()
      if (cancelled) return
      if (data) {
        setUser(data as User)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username: string) => {
    setLoading(true)
    try {
      const u = await getOrCreateUser(username)
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
