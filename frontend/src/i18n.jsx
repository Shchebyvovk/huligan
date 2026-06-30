import { createContext, useContext, useState } from 'react'

const modules = import.meta.glob('./locales/*.js', { eager: true })

// { 'uk': { default: {...strings}, name: 'Українська' }, ... }
const LOCALES = {}
for (const [path, mod] of Object.entries(modules)) {
  const key = path.match(/\/(\w+)\.js$/)?.[1]
  if (key) LOCALES[key] = mod.default
}

export const AVAILABLE_LOCALES = Object.entries(modules)
  .map(([path, mod]) => ({
    value: path.match(/\/(\w+)\.js$/)?.[1] ?? '',
    label: mod.name ?? path,
  }))
  .filter(l => l.value)
  .sort((a, b) => a.value.localeCompare(b.value))

const FALLBACK = LOCALES.uk ?? Object.values(LOCALES)[0] ?? {}
const STORAGE_KEY = 'huligan_locale'

const LocaleContext = createContext(null)

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? 'uk'
  )

  function changeLocale(l) {
    localStorage.setItem(STORAGE_KEY, l)
    setLocale(l)
  }

  return (
    <LocaleContext.Provider value={{ locale, changeLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useT() {
  const { locale } = useContext(LocaleContext)
  const strings = LOCALES[locale] ?? FALLBACK
  return (key, ...args) => {
    const val = strings[key]
    if (typeof val === 'function') return val(...args)
    return val ?? key
  }
}

export function useLocale() {
  return useContext(LocaleContext)
}
