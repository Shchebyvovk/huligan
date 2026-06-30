import { useState } from 'react'
import { useT, useLocale, AVAILABLE_LOCALES } from '../i18n'

const THEMES = ['huligan-dark', 'midnight', 'light']

export default function SettingsModal({ onClose }) {
  const t = useT()
  const { locale, changeLocale } = useLocale()
  const [theme, setTheme] = useState('huligan-dark')
  const [selectedLocale, setSelectedLocale] = useState(locale)

  function handleSave() {
    changeLocale(selectedLocale)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">{t('settings_title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">{t('settings_theme')}</label>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors"
            >
              {THEMES.map(th => <option key={th} value={th}>{th}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">{t('settings_language')}</label>
            <select
              value={selectedLocale}
              onChange={e => setSelectedLocale(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors"
            >
              {AVAILABLE_LOCALES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-6 w-full bg-purple-600 hover:bg-purple-500 text-white rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer"
        >
          {t('settings_save')}
        </button>
      </div>
    </div>
  )
}
