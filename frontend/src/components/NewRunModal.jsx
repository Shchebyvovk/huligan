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

  async function handleDelete(name, e) {
    e.stopPropagation()
    setError('')
    try {
      await api.deleteScenario(name)
      setScenarios(list => {
        const next = list.filter(s => s.name !== name)
        if (scenarioName === name) setScenarioName(next[0]?.name ?? '')
        return next
      })
    } catch {
      setError('Не вдалося видалити сценарій')
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
            <label className="text-sm text-gray-400">
              Сценарій
              <span className="text-gray-600 ml-2">(останні 10)</span>
            </label>
            {scenarios.length === 0 ? (
              <p className="text-sm text-gray-500 px-1 py-1">Немає завантажених сценаріїв</p>
            ) : (
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {scenarios.map(s => (
                  <label
                    key={s.name}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                      scenarioName === s.name
                        ? 'bg-purple-600/20 border-purple-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <input
                        type="radio"
                        name="scenario"
                        value={s.name}
                        checked={scenarioName === s.name}
                        onChange={() => setScenarioName(s.name)}
                        className="cursor-pointer"
                      />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={e => handleDelete(s.name, e)}
                      className="text-gray-500 hover:text-red-400 transition-colors text-xs cursor-pointer shrink-0"
                      title="Видалити сценарій"
                    >
                      Видалити
                    </button>
                  </label>
                ))}
              </div>
            )}
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
