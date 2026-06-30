import { useState } from 'react'

const THEMES = ['huligan-dark', 'midnight', 'light']
const LOCALES = ['uk', 'en']

export default function SettingsModal({ onClose }) {
  const [theme, setTheme] = useState('huligan-dark')
  const [locale, setLocale] = useState('uk')

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">Налаштування</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Тема</label>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors"
            >
              {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Мова</label>
            <select
              value={locale}
              onChange={e => setLocale(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors"
            >
              {LOCALES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-purple-600 hover:bg-purple-500 text-white rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer"
        >
          Зберегти
        </button>
      </div>
    </div>
  )
}
