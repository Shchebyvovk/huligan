import { useState } from 'react'
import { useT, useLocale, AVAILABLE_LOCALES } from '../i18n'
import { useTheme, AVAILABLE_THEMES } from '../theme'

export default function SettingsModal({ onClose }) {
  const t = useT()
  const { locale, changeLocale } = useLocale()
  const { theme, changeTheme } = useTheme()
  const [selectedLocale, setSelectedLocale] = useState(locale)
  const [selectedTheme, setSelectedTheme] = useState(theme)

  function handleSave() {
    changeLocale(selectedLocale)
    changeTheme(selectedTheme)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-[var(--c-text)]">{t('settings_title')}</h2>
          <button
            onClick={onClose}
            className="text-[var(--c-text-4)] hover:text-[var(--c-text)] transition-colors text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[var(--c-text-3)]">{t('settings_theme')}</label>
            <select
              value={selectedTheme}
              onChange={e => setSelectedTheme(e.target.value)}
              className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors"
            >
              {AVAILABLE_THEMES.map(th => (
                <option key={th.value} value={th.value}>{th.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-[var(--c-text-3)]">{t('settings_language')}</label>
            <select
              value={selectedLocale}
              onChange={e => setSelectedLocale(e.target.value)}
              className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors"
            >
              {AVAILABLE_LOCALES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-6 w-full bg-[var(--c-accent-bg)] hover:bg-[var(--c-accent-hover)] text-white rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer"
        >
          {t('settings_save')}
        </button>
      </div>
    </div>
  )
}
