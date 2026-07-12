import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type ThemeId = 'pixel' | 'fairy' | 'cosmic'

type ThemeConfig = {
  id: ThemeId
  label: string
  emoji: string
}

export const THEMES: ThemeConfig[] = [
  { id: 'pixel', label: '像素风', emoji: '🎮' },
  { id: 'fairy', label: '童话风', emoji: '🧚' },
  { id: 'cosmic', label: '星海风', emoji: '🌊' },
]

type ThemeContextValue = {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'kaodian-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId
    return stored && ['pixel', 'fairy', 'cosmic'].includes(stored) ? stored : 'cosmic'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (t: ThemeId) => setThemeState(t)

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
