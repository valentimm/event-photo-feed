import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from './supabase'
import type { Admin } from './types'

const STORAGE_KEY = 'event-photo-feed:admin'

interface AdminAuthContextValue {
  admin: Admin | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined)

function readStoredAdmin(): Admin | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Admin) : null
  } catch {
    return null
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(() => readStoredAdmin())
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    try {
      const trimmed = username.trim()
      if (!trimmed || !password) throw new Error('Preencha usuário e senha.')

      const { data, error } = await supabase
        .from('admins')
        .select('id, username, password')
        .eq('username', trimmed)
        .maybeSingle()

      if (error) throw error
      if (!data || data.password !== password) {
        throw new Error('Usuário ou senha de admin incorretos.')
      }

      const session: Admin = { id: data.id, username: data.username }
      setAdmin(session)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setAdmin(null)
  }, [])

  const value = useMemo<AdminAuthContextValue>(
    () => ({ admin, loading, login, logout }),
    [admin, loading, login, logout],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth deve ser usado dentro de <AdminAuthProvider>.')
  return ctx
}
