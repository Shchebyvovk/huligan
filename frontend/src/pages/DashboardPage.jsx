import { useState } from 'react'
import SettingsModal from '../components/SettingsModal'
import RunCard from '../components/RunCard'
import NewRunModal from '../components/NewRunModal'

const MOCK_RUNS = [
  { id: 3, scenario: 'chat-flood', concurrency: 500, status: 'running',   started_at: '2026-06-30T14:00:00Z' },
  { id: 2, scenario: 'login-loop', concurrency: 100, status: 'completed', started_at: '2026-06-30T12:00:00Z' },
  { id: 1, scenario: 'chat-flood', concurrency: 200, status: 'failed',    started_at: '2026-06-30T10:00:00Z' },
]

export default function DashboardPage() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newRunOpen, setNewRunOpen] = useState(false)
  const [runs] = useState(MOCK_RUNS)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-lg">
          Huligan <span className="text-purple-400">Admin</span>
        </span>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          Налаштування
        </button>
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

        <div className="flex flex-col gap-3">
          {runs.map(run => <RunCard key={run.id} run={run} />)}
        </div>
      </main>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {newRunOpen && <NewRunModal onClose={() => setNewRunOpen(false)} />}
    </div>
  )
}
