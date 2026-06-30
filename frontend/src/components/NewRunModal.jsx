import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

export default function NewRunModal({ onClose }) {
  const [scenarios, setScenarios] = useState([])
  const [scenarioName, setScenarioName] = useState('')
  const [concurrency, setConcurrency] = useState(100)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    api.getScenarios().then(list => {
      setScenarios(list)
      if (list.length > 0) setScenarioName(list[0].name)
    })
  }, [])

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const text = await file.text()
      const steps = JSON.parse(text)
      const name = file.name.replace(/\.json$/, '')
      const res = await api.createScenario({ name, steps })
      if (!res.ok) {
        const { message } = await res.json()
        setError(message || 'Невалідний файл сценарію')
        return
      }
      const saved = await res.json()
      setScenarios(list => [...list.filter(s => s.name !== saved.name), saved])
      setScenarioName(saved.name)
    } catch {
      setError('Файл має бути валідним JSON-сценарієм')
    } finally {
      setUploading(false)
    }
  }

  async function handleStart() {
    const scenario = scenarios.find(s => s.name === scenarioName)
    if (!scenario) {
      setError('Оберіть сценарій')
      return
    }

    setLoading(true)
    setError('')
    try {
      const run = await api.createRun({ scenario, concurrency: Number(concurrency) })
      if (run) onClose()
    } catch {
      setError('Не вдалося створити ран')
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
              value={scenarioName}
              onChange={e => setScenarioName(e.target.value)}
              disabled={scenarios.length === 0}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
            >
              {scenarios.length === 0 && <option value="">Немає завантажених сценаріїв</option>}
              {scenarios.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors text-left cursor-pointer disabled:opacity-50"
            >
              {uploading ? 'Завантаження...' : '+ Завантажити сценарій з файлу (.json)'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
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

        {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleStart}
          disabled={loading || scenarios.length === 0}
          className="mt-6 w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer"
        >
          {loading ? 'Запуск...' : 'Запустити'}
        </button>
      </div>
    </div>
  )
}
