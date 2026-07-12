import { useTheme, THEMES, type ThemeId } from '../contexts/ThemeContext'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-switcher">
      {THEMES.map((t) => (
        <button
          key={t.id}
          className={`theme-btn ${theme === t.id ? 'active' : ''}`}
          data-theme-id={t.id}
          onClick={() => setTheme(t.id as ThemeId)}
          title={t.label}
        >
          <span className="theme-emoji">{t.emoji}</span>
          <span className="theme-label">{t.label}</span>
        </button>
      ))}
    </div>
  )
}
