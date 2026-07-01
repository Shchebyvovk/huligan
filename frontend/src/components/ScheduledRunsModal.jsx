import { useState, useEffect } from 'react'
import { api } from '../api'

const INTERVAL_OPTIONS = [
  { label: '15 хв',  ms: 900000 },
  { label: '30 хв',  ms: 1800000 },
  { label: '1 год',  ms: 3600000 },
  { label: '6 год',  ms: 21600000 },
  { label: '12 год', ms: 43200000 },
  { label: '24 год', ms: 86400000 },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ScheduledRunsModal({ onClose }) {
  const [scenarios, setScenarios] = useState([])
  const [runs, setRuns] = useState([])
  const [scenarioName, setScenarioName] = useState('')
  const [targetUrl, setTargetUrl] = useState(() => localStorage.getItem('huligan_target_url') ?? '')
  const [concurrency, setConcurrency] = useState(1)
  const [scheduledAt, setScheduledAt] = useState('')
  const [repeat, setRepeat] = useState(false)
  const [intervalMs, setIntervalMs] = useState(3600000)
  const [maxIterations, setMaxIterations] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getScenarios().then(list => {
      setScenarios(list)
      if (list.length > 0) setScenarioName(list[0].name)
    })
    api.getScheduledRuns().then(setRuns)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!scenarioName || !targetUrl || !scheduledAt) {
      setError('Заповніть усі обов'язкові поля')
      return
    }
    setLoading(true)
    setError('')
    try {
      const run = await api.createScheduledRun({
        scenarioName,
        targetUrl,
        concurrency: Number(concurrency),
        scheduledAt: new Date(scheduledAt).toISOString(),
        repeatIntervalMs: repeat ? Number(intervalMs) : null,
        maxIterations: repeat && maxIterations ? Number(maxIterations) : null,
      })
      if (run) setRuns(prev => [...prev, run])
    } catch {
      setError('Помилка при збереженні')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    await api.deleteScheduledRun(id)
    setRuns(prev => prev.filter(r => r.id !== id))
  }

  async function handleToggle(r) {
    await api.toggleScheduledRun(r.id, !r.active)
    setRuns(prev => prev.map(x => x.id === r.id ? { ...x, active: !x.active } : x))
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-[var(--c-text)]">Заплановані запуски</h2>
          <button onClick={onClose} className="text-[var(--c-text-4)] hover:text-[var(--c-text)] text-xl leading-none cursor-pointer">×</button>
        </div>

        {/* Create form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--c-text-3)]">Сценарій</label>
            <select
              value={scenarioName}
              onChange={e => setScenarioName(e.target.value)}
              disabled={scenarios.length === 0}
              className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors disabled:opacity-50"
            >
              {scenarios.length === 0 && <option value="">Немає сценаріїв</option>}
              {scenarios.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--c-text-3)]">Цільовий URL</label>
            <input
              type="url"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              placeholder="https://chat.example.com"
              className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors placeholder:text-[var(--c-text-4)]"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 w-28">
              <label className="text-xs text-[var(--c-text-3)]">Паралельні юзери</label>
              <input
                type="number" min={1} max={10000} value={concurrency}
                onChange={e => setConcurrency(e.target.value)}
                className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-[var(--c-text-3)]">Дата та час</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-[var(--c-text-3)] cursor-pointer">
              <input
                type="checkbox"
                checked={repeat}
                onChange={e => setRepeat(e.target.checked)}
                className="accent-[var(--c-accent-bg)]"
              />
              Повторювати кожні
            </label>

            {repeat && (
              <div className="flex gap-3 pl-6">
                <select
                  value={intervalMs}
                  onChange={e => setIntervalMs(Number(e.target.value))}
                  className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-1.5 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors"
                >
                  {INTERVAL_OPTIONS.map(o => (
                    <option key={o.ms} value={o.ms}>{o.label}</option>
                  ))}
                </select>
                <div className="flex flex-col gap-0.5 flex-1">
                  <label className="text-xs text-[var(--c-text-4)]">Макс. ітерацій</label>
                  <input
                    type="number" min={1} max={100} value={maxIterations}
                    onChange={e => setMaxIterations(e.target.value)}
                    placeholder="∞"
                    className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-1.5 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors placeholder:text-[var(--c-text-4)]"
                  />
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || scenarios.length === 0}
            className="w-full bg-[var(--c-accent-bg)] hover:bg-[var(--c-accent-hover)] disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer mt-1"
          >
            {loading ? 'Збереження...' : 'Запланувати'}
          </button>
        </form>

        {/* List */}
        {runs.length === 0 ? (
          <p className="text-sm text-[var(--c-text-4)]">Немає запланованих запусків</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[var(--c-text-4)] uppercase tracking-wide mb-1">Заплановані</p>
            {runs.map(r => (
              <div key={r.id} className="bg-[var(--c-surface-2)] border border-[var(--c-border)] rounded-lg px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--c-text)] truncate">{r.scenarioName}</span>
                    <span className="text-xs text-[var(--c-text-4)]">×{r.concurrency}</span>
                    {!r.active && <span className="text-xs bg-[var(--c-surface-3)] text-[var(--c-text-4)] px-1.5 py-0.5 rounded">пауза</span>}
                  </div>
                  <div className="text-xs text-[var(--c-text-3)] mt-0.5">
                    Наступний: {formatDate(r.nextRunAt)}
                  </div>
                  {r.repeatIntervalMs && (
                    <div className="text-xs text-[var(--c-text-4)] mt-0.5">
                      {INTERVAL_OPTIONS.find(o => o.ms === r.repeatIntervalMs)?.label ?? `${r.repeatIntervalMs}ms`}
                      {r.maxIterations ? ` · ітерація ${r.iterationsDone}/${r.maxIterations}` : ''}
                    </div>
                  )}
                  {r.lastRunAt && (
                    <div className="text-xs text-[var(--c-text-4)] mt-0.5">
                      Останній запуск: {formatDate(r.lastRunAt)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(r)}
                    className="text-[var(--c-text-4)] hover:text-[var(--c-text)] text-base leading-none cursor-pointer px-1"
                    title={r.active ? 'Призупинити' : 'Відновити'}
                  >
                    {r.active ? '⏸' : '▶'}
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-[var(--c-text-4)] hover:text-red-400 text-lg leading-none cursor-pointer px-1"
                    title="Видалити"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
