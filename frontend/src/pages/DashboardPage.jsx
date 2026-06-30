import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import SettingsModal from '../components/SettingsModal'
import RunCard from '../components/RunCard'
import NewRunModal from '../components/NewRunModal'

export default function DashboardPage() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newRunOpen, setNewRunOpen] = useState(false)
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function loadRuns() {
    setLoading(true)
    const data = await api.getRuns()
    if (data) setRuns(data)
    setLoading(false)
  }

  useEffect(() => { loadRuns() }, [])

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
            Налаштування
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Вийти
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">Тест-рани</h2>
          <button
            onClick={() => setNewRunOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            + Новий ран
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Завантаження...</p>
        ) : runs.length === 0 ? (
          <p className="text-gray-500 text-sm">Ще немає ранів</p>
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
