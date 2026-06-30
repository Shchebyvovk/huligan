import { useState } from 'react'

const SCENARIOS = ['chat-flood', 'login-loop']

export default function NewRunModal({ onClose }) {
  const [scenario, setScenario] = useState(SCENARIOS[0])
  const [concurrency, setConcurrency] = useState(100)
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, concurrency: Number(concurrency) }),
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">Новий ран</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Сценарій</label>
            <select
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors"
            >
              {SCENARIOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">
              Кількість юзерів
              <span className="text-gray-600 ml-2">(макс. 10 000)</span>
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={concurrency}
              onChange={e => setConcurrency(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={loading}
          className="mt-6 w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer"
        >
          {loading ? 'Запуск...' : 'Запустити'}
        </button>
      </div>
    </div>
  )
}
