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
import { joinEvent } from './events'
import { loginOrRegister } from './userAuth'

const STORAGE_KEY = 'event-photo-feed:user'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string, eventId?: string) => Promise<void>
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())
  const [loading, setLoading] = useState(false)

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

  const login = useCallback(async (username: string, password: string, eventId?: string) => {
    setLoading(true)
    try {
      const u = await loginOrRegister(username, password)
      if (eventId) await joinEvent(eventId, u.id)
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

export { searchUsernames } from './userAuth'
