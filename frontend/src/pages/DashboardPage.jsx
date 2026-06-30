import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useT } from '../i18n'
import SettingsModal from '../components/SettingsModal'
import RunCard from '../components/RunCard'
import NewRunModal from '../components/NewRunModal'

export default function DashboardPage() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newRunOpen, setNewRunOpen] = useState(false)
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const t = useT()

  async function loadRuns({ silent = false } = {}) {
    if (!silent) setLoading(true)
    const data = await api.getRuns()
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

  async function handleLogout() {
    await api.logout()
    navigate('/login')
  }

  function handleRunCreated() {
    setNewRunOpen(false)
    loadRuns()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-lg">
          Huligan <span className="text-purple-400">Admin</span>
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {t('nav_settings')}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {t('nav_logout')}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">{t('runs_title')}</h2>
          <button
            onClick={() => setNewRunOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            {t('runs_new')}
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">{t('runs_loading')}</p>
        ) : runs.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('runs_empty')}</p>
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
