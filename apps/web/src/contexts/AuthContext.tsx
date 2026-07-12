import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { authApi, getToken, setToken, setStoredUser, getStoredUser, clearToken } from '../utils/api'

type User = {
  id: string
  email: string
  username: string
  role?: string
  createdAt?: string
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  isGuest: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  loginAsGuest: () => void
  forgotPassword: (email: string) => Promise<{ message: string; resetUrl?: string }>
  resetPassword: (token: string, password: string) => Promise<{ message: string }>
  startOAuth: (provider: 'wechat' | 'google' | 'apple') => Promise<{ configured: boolean; url?: string; message?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const GUEST_USER_ID = 'guest-demo-user'
const GUEST_USER: User = {
  id: GUEST_USER_ID,
  email: 'guest@demo.local',
  username: '体验用户',
  role: 'guest',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = getStoredUser()
    if (stored && stored.id === GUEST_USER_ID) return GUEST_USER
    return stored
  })
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(() => {
    const stored = getStoredUser()
    return stored?.id === GUEST_USER_ID
  })

  useEffect(() => {
    const token = getToken()
    const stored = getStoredUser()
    if (stored?.id === GUEST_USER_ID) {
      setUser(GUEST_USER)
      setIsGuest(true)
      setLoading(false)
      return
    }
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((u) => {
        setUser(u)
        setStoredUser(u)
        setIsGuest(false)
      })
      .catch(() => {
        clearToken()
        setUser(null)
        setIsGuest(false)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    setToken(res.token)
    setStoredUser(res.user)
    setUser(res.user)
  }, [])

  const register = useCallback(async (email: string, username: string, password: string) => {
    const res = await authApi.register({ email, username, password })
    setToken(res.token)
    setStoredUser(res.user)
    setUser(res.user)
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    return authApi.forgotPassword({ email })
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    return authApi.resetPassword({ token, password })
  }, [])

  const startOAuth = useCallback(async (provider: 'wechat' | 'google' | 'apple') => {
    return authApi.startOAuth(provider)
  }, [])

  const loginAsGuest = useCallback(() => {
    setStoredUser(GUEST_USER)
    setUser(GUEST_USER)
    setIsGuest(true)
    localStorage.setItem('kaodian-guest-mode', '1')
  }, [])

  const logout = useCallback(() => {
    const wasGuest = isGuest || user?.id === GUEST_USER_ID
    clearToken()
    localStorage.removeItem('kaodian-guest-mode')
    setUser(null)
    setIsGuest(false)
    if (wasGuest) {
      localStorage.removeItem('kaodian-user')
      const keys = ['kd_courses', 'kd_materials', 'kd_tasks', 'kd_analyses', 'kd_plans', 'kd_history']
      keys.forEach(k => {
        try {
          const val = localStorage.getItem(k)
          if (val) {
            const parsed = JSON.parse(val)
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((item: any) => item.userId !== GUEST_USER_ID && item.courseId)
              localStorage.setItem(k, JSON.stringify(filtered.length < parsed.length ? filtered : parsed))
            }
          }
        } catch {}
      })
    }
  }, [isGuest, user])

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, login, register, loginAsGuest, forgotPassword, resetPassword, startOAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
