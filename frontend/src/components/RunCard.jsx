import { useState, useEffect, useRef } from 'react'
import { useT, useLocale } from '../i18n'
import { api } from '../api'

const STATUS_STYLES = {
  running:   'bg-blue-500/20 text-blue-300',
  completed: 'bg-green-500/20 text-green-300',
  failed:    'bg-red-500/20 text-red-300',
  pending:   'bg-gray-500/20 text-gray-400',
}

function LatencyChart({ steps }) {
  const entries = Object.entries(steps)
  if (entries.length === 0) return null

  const W = 480
  const H = 140
  const PAD = { top: 12, right: 16, bottom: 36, left: 52 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...entries.map(([, s]) => s.max || s.avg), 1)
  const barW = Math.min(40, (innerW / entries.length) * 0.5)
  const gap = innerW / entries.length

  function y(val) {
    return PAD.top + innerH - (val / maxVal) * innerH
  }

  function fmt(ms) {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
  }

  const gridLines = [0.25, 0.5, 0.75, 1].map(f => Math.round(maxVal * f))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {/* grid */}
      {gridLines.map(v => (
        <g key={v}>
          <line
            x1={PAD.left} y1={y(v)} x2={W - PAD.right} y2={y(v)}
            stroke="var(--c-border)" strokeWidth="1" strokeDasharray="3 3"
          />
          <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end"
            fontSize="9" fill="var(--c-text-4)">{fmt(v)}</text>
        </g>
      ))}

      {/* bars */}
      {entries.map(([action, s], i) => {
        const cx = PAD.left + gap * i + gap / 2
        const hasErr = s.failed > 0
        const barColor = hasErr ? '#f87171' : '#34d399'
        const rangeColor = hasErr ? '#fca5a5' : '#6ee7b7'
        const avgY = y(s.avg)
        const barH = innerH - (avgY - PAD.top)
        const minY = y(s.min)
        const maxY = y(s.max || s.avg)

        return (
          <g key={action}>
            {/* min-max range line */}
            {s.max > s.min && (
              <line x1={cx} y1={maxY} x2={cx} y2={minY}
                stroke={rangeColor} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            )}
            {/* avg bar */}
            <rect
              x={cx - barW / 2} y={avgY}
              width={barW} height={Math.max(barH, 2)}
              rx="3" fill={barColor} opacity="0.8"
            />
            {/* avg label */}
            <text x={cx} y={avgY - 4} textAnchor="middle"
              fontSize="9" fill="var(--c-text-3)">{fmt(s.avg)}</text>
            {/* action label */}
            <text x={cx} y={H - PAD.bottom + 14} textAnchor="middle"
              fontSize="10" fill="var(--c-text-3)">{action}</text>
          </g>
        )
      })}
    </svg>
  )
}

function StepRow({ action, s }) {
  return (
    <div className="py-2 border-b border-[var(--c-border)] last:border-0">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--c-text-3)] font-mono w-32 shrink-0">{action}</span>
        <span className="text-[var(--c-text-2)]">{s.avg}ms avg</span>
        <span className="text-[var(--c-text-3)]">{s.min}–{s.max}ms</span>
        {s.failed > 0
          ? <span className="text-red-400">{s.failed} err</span>
          : <span className="text-green-400">✓</span>
        }
      </div>
      {s.errors?.length > 0 && (
        <div className="mt-1.5 flex flex-col gap-0.5 pl-32">
          {s.errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-red-400/60 shrink-0 tabular-nums w-8">×{e.count}</span>
              <span className="text-red-400/90 font-mono break-all">{e.msg}</span>
            </div>
          ))}
        </div>
      )}
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

  useEffect(() => { setRun(initialRun) }, [initialRun])

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
            <ProgressBar completed={run.completedCount ?? 0} total={run.concurrency} />
          )}
        </div>
        <div className="flex items-center gap-3 ml-4">
          <span className="text-xs text-[var(--c-text-4)]">#{run.id}</span>
          {r && <span className="text-[var(--c-text-4)] text-xs">{expanded ? '▲' : '▼'}</span>}
        </div>
      </div>

      {expanded && r && (
        <div className="px-5 py-4 bg-[var(--c-surface-2)] border-t border-[var(--c-border)]">
          {/* summary */}
          <div className="flex gap-6 mb-4">
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
                {r.total > 0 ? Math.round((r.passed / r.total) * 100) : 0}%
              </div>
              <div className="text-xs text-[var(--c-text-4)]">success</div>
            </div>
          </div>

          {/* latency chart */}
          <div className="mb-4 bg-[var(--c-surface)] rounded-lg p-3">
            <p className="text-xs text-[var(--c-text-4)] mb-2">Latency (avg bar · min–max line)</p>
            <LatencyChart steps={r.steps} />
          </div>

          {/* per-step details */}
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
