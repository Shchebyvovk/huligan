import { useState, useEffect } from 'react'
import { api } from '../api'
import { useT, useLocale } from '../i18n'
import { getTrashDays } from './SettingsModal'

export default function TrashModal({ onClose, onRestored }) {
  const t = useT()
  const { locale } = useLocale()
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    api.getTrashedRuns().then(data => { setRuns(data ?? []); setLoading(false) })
  }, [])

  function toggle(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleAll() {
    setSelected(s => s.size === runs.length ? new Set() : new Set(runs.map(r => r.id)))
  }

  async function handleRestore() {
    const ids = selected.size > 0 ? [...selected] : runs.map(r => r.id)
    await api.restoreRuns(ids)
    setRuns(r => r.filter(x => !ids.includes(x.id)))
    setSelected(new Set())
    onRestored()
  }

  async function handleHardDelete() {
    const ids = selected.size > 0 ? [...selected] : runs.map(r => r.id)
    await api.hardDeleteRuns(ids)
    setRuns(r => r.filter(x => !ids.includes(x.id)))
    setSelected(new Set())
    setConfirm(false)
  }

  const trashDays = getTrashDays()

  function daysLeft(deletedAt) {
    const expires = new Date(deletedAt).getTime() + trashDays * 86400_000
    const left = Math.ceil((expires - Date.now()) / 86400_000)
    return Math.max(0, left)
  }

  const actionIds = selected.size > 0 ? [...selected] : runs.map(r => r.id)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
      <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl w-full max-w-xl mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--c-border)] shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-[var(--c-text)]">{t('trash_title')}</h2>
            {runs.length > 0 && (
              <button onClick={toggleAll} className="text-xs text-[var(--c-text-4)] hover:text-[var(--c-text)] cursor-pointer transition-colors">
                {selected.size === runs.length ? 'зняти все' : 'вибрати все'}
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-[var(--c-text-4)] hover:text-[var(--c-text)] text-xl leading-none cursor-pointer">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && <p className="text-[var(--c-text-4)] text-sm">Завантаження...</p>}
          {!loading && runs.length === 0 && (
            <p className="text-[var(--c-text-4)] text-sm text-center py-8">{t('trash_empty')}</p>
          )}
          {runs.map(run => {
            const name = run.scenario?.name ?? run.scenario ?? '—'
            const time = new Date(run.createdAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'uk-UA')
            const left = daysLeft(run.deletedAt)
            const isSelected = selected.has(run.id)
            return (
              <div
                key={run.id}
                onClick={() => toggle(run.id)}
                className={`flex items-center gap-3 py-2.5 border-b border-[var(--c-border)] last:border-0 cursor-pointer rounded-lg px-2 -mx-2 transition-colors ${isSelected ? 'bg-[var(--c-accent-faint)]' : 'hover:bg-[var(--c-surface-2)]'}`}
              >
                <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-[var(--c-accent)] border-[var(--c-accent)]' : 'border-[var(--c-border-input)]'}`}>
                  {isSelected && <span className="text-white text-[10px] leading-none">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--c-text)]">{name}</span>
                    <span className="text-xs text-[var(--c-text-4)]">#{run.id}</span>
                  </div>
                  <div className="text-xs text-[var(--c-text-4)]">{run.concurrency} users · {time}</div>
                </div>
                <span className={`text-xs shrink-0 ${left <= 3 ? 'text-red-400' : 'text-[var(--c-text-4)]'}`}>
                  {t('trash_expires', left)}
                </span>
              </div>
            )
          })}
        </div>

        {runs.length > 0 && (
          <div className="px-6 py-4 border-t border-[var(--c-border)] shrink-0">
            {confirm ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--c-text-2)] flex-1">
                  {t('trash_confirm_delete', actionIds.length)}
                </span>
                <button onClick={handleHardDelete} className="text-sm text-red-400 hover:text-red-300 cursor-pointer font-medium">{t('trash_confirm_yes')}</button>
                <button onClick={() => setConfirm(false)} className="text-sm text-[var(--c-text-3)] hover:text-[var(--c-text)] cursor-pointer">{t('trash_confirm_no')}</button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleRestore}
                  className="flex-1 bg-[var(--c-surface-2)] hover:bg-[var(--c-surface-3)] text-[var(--c-text-2)] rounded-lg py-2 text-sm transition-colors cursor-pointer"
                >
                  {t('trash_restore')} {selected.size > 0 ? `(${selected.size})` : `(${runs.length})`}
                </button>
                <button
                  onClick={() => setConfirm(true)}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg py-2 text-sm transition-colors cursor-pointer"
                >
                  {t('trash_delete_forever')} {selected.size > 0 ? `(${selected.size})` : `(${runs.length})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
