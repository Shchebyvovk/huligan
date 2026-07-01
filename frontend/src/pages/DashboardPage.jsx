import { useState, useEffect } from 'react'
import { api } from '../api'
import { useT } from '../i18n'
import AppHeader from '../components/AppHeader'
import SettingsModal, { getMaxRuns, getTrashDays, getKeepaliveUrl, notify } from '../components/SettingsModal'
import RunCard from '../components/RunCard'
import NewRunModal from '../components/NewRunModal'
import CompareModal from '../components/CompareModal'
import TrashModal from '../components/TrashModal'
import ScheduledRunsModal from '../components/ScheduledRunsModal'

export default function DashboardPage() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newRunOpen, setNewRunOpen] = useState(false)
  const [trashOpen, setTrashOpen] = useState(false)
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [compareRuns, setCompareRuns] = useState(null)
  const [scheduledOpen, setScheduledOpen] = useState(false)
  const prevStatusRef = useState(() => ({}))[0]
  const t = useT()

  async function loadRuns({ silent = false } = {}) {
    if (!silent) setLoading(true)
    const data = await api.getRuns(getMaxRuns(), getTrashDays())
    if (data) {
      setRuns(data)
      for (const run of data) {
        const prev = prevStatusRef[run.id]
        const active = run.status === 'pending' || run.status === 'running'
        if (prev && prev !== run.status && !active) {
          const scenarioName = run.scenario?.name ?? run.scenario ?? 'Ран'
          if (run.status === 'completed') notify(`✓ ${scenarioName} завершено`, `${run.results?.passed ?? 0}/${run.results?.total ?? 0} passed`)
          else if (run.status === 'partial') notify(`⚠ ${scenarioName} частково`, `${run.results?.passed ?? 0}/${run.results?.total ?? 0} passed`)
          else if (run.status === 'failed') notify(`✗ ${scenarioName} провалено`, `${run.results?.failed ?? 0} помилок`)
        }
        prevStatusRef[run.id] = run.status
      }
    }
    if (!silent) setLoading(false)
  }

  useEffect(() => { loadRuns() }, [])

  useEffect(() => {
    function ping() {
      const url = getKeepaliveUrl()
      if (url) fetch(url, { mode: 'no-cors' }).catch(() => {})
    }
    ping()
    const id = setInterval(ping, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const hasActiveRun = runs.some(r => r.status === 'pending' || r.status === 'running')
    if (!hasActiveRun) return
    const id = setInterval(() => loadRuns({ silent: true }), 3000)
    return () => clearInterval(id)
  }, [runs])

  function toggleSelect(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
    setDeleteConfirm(false)
  }

  async function handleDelete() {
    const ids = [...selected]
    await api.softDeleteRuns(ids)
    setRuns(r => r.filter(x => !ids.includes(x.id)))
    setSelected(new Set())
    setDeleteConfirm(false)
  }

  function handleCompare() {
    const [idA, idB] = [...selected]
    const runA = runs.find(r => r.id === idA)
    const runB = runs.find(r => r.id === idB)
    if (runA && runB) setCompareRuns([runA, runB])
  }

  const selCount = selected.size

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
      <AppHeader onSettings={() => setSettingsOpen(true)} />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">{t('runs_title')}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScheduledOpen(true)}
              className="text-sm text-[var(--c-text-4)] hover:text-[var(--c-text)] transition-colors cursor-pointer"
              title="Заплановані запуски"
            >
              📅
            </button>
            <button
              onClick={() => setTrashOpen(true)}
              className="text-sm text-[var(--c-text-4)] hover:text-[var(--c-text)] transition-colors cursor-pointer"
              title={t('trash_title')}
            >
              🗑
            </button>
            <button
              onClick={() => setNewRunOpen(true)}
              className="bg-[var(--c-accent-bg)] hover:bg-[var(--c-accent-hover)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {t('runs_new')}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-[var(--c-text-4)] text-sm">{t('runs_loading')}</p>
        ) : runs.length === 0 ? (
          <p className="text-[var(--c-text-4)] text-sm">{t('runs_empty')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {runs.map(run => (
              <RunCard
                key={run.id}
                run={run}
                selectable
                selected={selected.has(run.id)}
                onToggle={toggleSelect}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating action bar */}
      {selCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl shadow-xl px-5 py-3 flex items-center gap-4">
            <span className="text-sm text-[var(--c-text-3)]">
              Вибрано: <span className="text-[var(--c-text)] font-medium">{selCount}</span>
            </span>

            {selCount === 2 && (
              <button
                onClick={handleCompare}
                className="text-sm bg-[var(--c-accent-bg)] hover:bg-[var(--c-accent-hover)] text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
              >
                {t('runs_compare')}
              </button>
            )}

            {deleteConfirm ? (
              <>
                <span className="text-sm text-[var(--c-text-2)]">{t('runs_delete_confirm', selCount)}</span>
                <button onClick={handleDelete} className="text-sm text-red-400 hover:text-red-300 cursor-pointer font-medium">{t('trash_confirm_yes')}</button>
                <button onClick={() => setDeleteConfirm(false)} className="text-sm text-[var(--c-text-3)] hover:text-[var(--c-text)] cursor-pointer">{t('trash_confirm_no')}</button>
              </>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="text-sm text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                {t('runs_delete')}
              </button>
            )}

            <button
              onClick={() => { setSelected(new Set()); setDeleteConfirm(false) }}
              className="text-[var(--c-text-4)] hover:text-[var(--c-text)] text-lg leading-none cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {settingsOpen && <SettingsModal onClose={() => { setSettingsOpen(false); loadRuns() }} />}
      {newRunOpen && <NewRunModal onClose={() => { setNewRunOpen(false); loadRuns() }} />}
      {trashOpen && <TrashModal onClose={() => setTrashOpen(false)} onRestored={() => { setTrashOpen(false); loadRuns() }} />}
      {compareRuns && <CompareModal runA={compareRuns[0]} runB={compareRuns[1]} onClose={() => setCompareRuns(null)} />}
      {scheduledOpen && <ScheduledRunsModal onClose={() => setScheduledOpen(false)} />}
    </div>
  )
}
