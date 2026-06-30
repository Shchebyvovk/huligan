import { createContext, useContext, useState, useEffect } from 'react'

const modules = import.meta.glob('./themes/*.js', { eager: true })

const THEMES = {}
for (const [path, mod] of Object.entries(modules)) {
  const key = path.match(/\/(\w[\w-]*)\.js$/)?.[1]
  if (key && mod.default) THEMES[key] = mod.default
}

export const AVAILABLE_THEMES = Object.entries(modules)
  .map(([path, mod]) => ({
    value: path.match(/\/(\w[\w-]*)\.js$/)?.[1] ?? '',
    label: mod.name ?? path,
  }))
  .filter(t => t.value)
  .sort((a, b) => a.label.localeCompare(b.label))

const STORAGE_KEY = 'huligan_theme'
const DEFAULT_THEME = 'purple'

function applyTheme(key) {
  const vars = THEMES[key] ?? THEMES[DEFAULT_THEME] ?? {}
  const root = document.documentElement
  for (const [prop, val] of Object.entries(vars)) {
    root.style.setProperty(prop, val)
  }
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME
  )

  useEffect(() => { applyTheme(theme) }, [theme])

  function changeTheme(key) {
    localStorage.setItem(STORAGE_KEY, key)
    setTheme(key)
  }

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
