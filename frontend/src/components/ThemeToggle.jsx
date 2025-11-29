import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const label = `Toggle ${theme === 'dark' ? 'light' : 'dark'} mode`

  return (
    <button
      type="button"
      className={`theme-toggle-button ${className}`.trim()}
      aria-label={label}
      aria-pressed={theme === 'dark'}
      onClick={toggleTheme}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggleTheme()
        }
      }}
    >
      <span aria-hidden="true">{theme === 'dark' ? 'Moon' : 'Sun'}</span>
    </button>
  )
}
