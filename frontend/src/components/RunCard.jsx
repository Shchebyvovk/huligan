import { useState, useEffect, useRef } from 'react'
import { useT, useLocale } from '../i18n'
import { api } from '../api'

const STATUS_STYLES = {
  running:   'bg-blue-500/20 text-blue-300',
  completed: 'bg-green-500/20 text-green-300',
  failed:    'bg-red-500/20 text-red-300',
  pending:   'bg-gray-500/20 text-gray-400',
}

function StepRow({ action, s }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-[var(--c-border)] last:border-0">
      <span className="text-[var(--c-text-3)] font-mono w-32">{action}</span>
      <span className="text-[var(--c-text-2)]">{s.avg}ms avg</span>
      <span className="text-[var(--c-text-3)]">{s.min}–{s.max}ms</span>
      {s.failed > 0
        ? <span className="text-red-400">{s.failed} err</span>
        : <span className="text-green-400">✓</span>
      }
    </div>
  )
}

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-[var(--c-text-4)] mb-1">
        <span>{completed} / {total} workers</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-[var(--c-surface-2)] rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function RunCard({ run: initialRun }) {
  const t = useT()
  const { locale } = useLocale()
  const [run, setRun] = useState(initialRun)
  const [expanded, setExpanded] = useState(false)
  const intervalRef = useRef(null)

  // синхронізуємо якщо пропс змінився (напр. після глобального poll)
  useEffect(() => { setRun(initialRun) }, [initialRun])

  // поллінг поки ран активний
  useEffect(() => {
    const active = run.status === 'running' || run.status === 'pending'
    if (!active) { clearInterval(intervalRef.current); return }

    intervalRef.current = setInterval(async () => {
      const data = await api.getRun(run.id)
      if (data) setRun(data)
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [run.status, run.id])

  const badge = STATUS_STYLES[run.status] ?? STATUS_STYLES.pending
  const scenarioName = run.scenario?.name ?? run.scenario ?? '—'
  const time = new Date(run.createdAt ?? run.started_at).toLocaleString(locale === 'en' ? 'en-GB' : 'uk-UA')
  const r = run.results
  const isActive = run.status === 'running' || run.status === 'pending'

  return (
    <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl overflow-hidden">
      <div
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[var(--c-surface-2)] transition-colors"
        onClick={() => r && setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-medium text-sm text-[var(--c-text)]">{scenarioName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>
              {run.status}
            </span>
            {r && (
              <span className="text-xs text-[var(--c-text-3)]">
                {r.passed}/{r.total} passed
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--c-text-4)]">
            {run.concurrency} {t('runs_users')} · {time}
            {run.targetUrl && <span className="ml-2 opacity-60">{run.targetUrl}</span>}
          </div>
          {isActive && (
            <ProgressBar
              completed={run.completedCount ?? 0}
              total={run.concurrency}
            />
          )}
        </div>
        <div className="flex items-center gap-3 ml-4">
          <span className="text-xs text-[var(--c-text-4)]">#{run.id}</span>
          {r && (
            <span className="text-[var(--c-text-4)] text-xs">{expanded ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      {expanded && r && (
        <div className="px-5 py-3 bg-[var(--c-surface-2)] border-t border-[var(--c-border)]">
          <div className="flex gap-6 mb-3">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-400">{r.passed}</div>
              <div className="text-xs text-[var(--c-text-4)]">passed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-400">{r.failed}</div>
              <div className="text-xs text-[var(--c-text-4)]">failed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-[var(--c-accent)]">
                {r.failed === 0 ? '100' : Math.round((r.passed / r.total) * 100)}%
              </div>
              <div className="text-xs text-[var(--c-text-4)]">success</div>
            </div>
          </div>
          <div className="flex flex-col">
            {Object.entries(r.steps).map(([action, s]) => (
              <StepRow key={action} action={action} s={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
