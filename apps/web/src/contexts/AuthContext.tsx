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
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  forgotPassword: (email: string) => Promise<{ message: string; resetUrl?: string }>
  resetPassword: (token: string, password: string) => Promise<{ message: string }>
  startOAuth: (provider: 'wechat' | 'google' | 'apple') => Promise<{ configured: boolean; url?: string; message?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((u) => {
        setUser(u)
        setStoredUser(u)
      })
      .catch(() => {
        clearToken()
        setUser(null)
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

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, forgotPassword, resetPassword, startOAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
