import { useState, useEffect } from 'react'
import { api } from '../api'
import { useT } from '../i18n'
import AppHeader from '../components/AppHeader'
import SettingsModal, { getMaxRuns } from '../components/SettingsModal'
import RunCard from '../components/RunCard'
import NewRunModal from '../components/NewRunModal'

export default function DashboardPage() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newRunOpen, setNewRunOpen] = useState(false)
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const t = useT()

  async function loadRuns({ silent = false } = {}) {
    if (!silent) setLoading(true)
    const data = await api.getRuns(getMaxRuns())
    if (data) setRuns(data)
    if (!silent) setLoading(false)
  }

  useEffect(() => { loadRuns() }, [])

  useEffect(() => {
    const hasActiveRun = runs.some(r => r.status === 'pending' || r.status === 'running')
    if (!hasActiveRun) return
    const id = setInterval(() => loadRuns({ silent: true }), 3000)
    return () => clearInterval(id)
  }, [runs])

  function handleRunCreated() {
    setNewRunOpen(false)
    loadRuns()
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
      <AppHeader onSettings={() => setSettingsOpen(true)} />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">{t('runs_title')}</h2>
          <button
            onClick={() => setNewRunOpen(true)}
            className="bg-[var(--c-accent-bg)] hover:bg-[var(--c-accent-hover)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            {t('runs_new')}
          </button>
        </div>

        {loading ? (
          <p className="text-[var(--c-text-4)] text-sm">{t('runs_loading')}</p>
        ) : runs.length === 0 ? (
          <p className="text-[var(--c-text-4)] text-sm">{t('runs_empty')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {runs.map(run => <RunCard key={run.id} run={run} />)}
          </div>
        )}
      </main>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {newRunOpen && <NewRunModal onClose={handleRunCreated} />}
    </div>
  )
}
