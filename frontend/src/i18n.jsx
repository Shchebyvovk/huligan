import { createContext, useContext, useState } from 'react'
import uk from './locales/uk.js'
import en from './locales/en.js'

const LOCALES = { uk, en }
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
  const strings = LOCALES[locale] ?? LOCALES.uk
  return (key, ...args) => {
    const val = strings[key]
    if (typeof val === 'function') return val(...args)
    return val ?? key
  }
}

export function useLocale() {
  return useContext(LocaleContext)
}

export const AVAILABLE_LOCALES = [
  { value: 'uk', label: 'Українська' },
  { value: 'en', label: 'English' },
]
