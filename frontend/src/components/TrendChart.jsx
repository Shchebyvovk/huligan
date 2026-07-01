import { useState, useRef, useEffect } from 'react'

const W = 600
const H = 80
const PAD = { top: 10, bottom: 18, left: 4, right: 28 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top - PAD.bottom

const DOT_COLOR = {
  completed: '#4ade80',
  partial:   '#facc15',
  failed:    '#f87171',
}

const COUNTS = [10, 20, 30, 50]
const METRICS = [
  { value: 'pct',     label: '% passed' },
  { value: 'latency', label: 'Avg latency' },
]

const PREFS_KEY = 'huligan_trend_prefs'
function loadPrefs() {
  try { return { count: 20, metric: 'pct', ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') } }
  catch { return { count: 20, metric: 'pct' } }
}
function savePrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)) }

export default function TrendChart({ runs }) {
  const [prefs, setPrefs] = useState(loadPrefs)
  const [panelOpen, setPanelOpen] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const [scenario, setScenario] = useState('all')
  const panelRef = useRef(null)

  useEffect(() => {
    if (!panelOpen) return
    function onClickOutside(e) { if (panelRef.current && !panelRef.current.contains(e.target)) setPanelOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [panelOpen])

  function setAndSave(patch) {
    setPrefs(p => { const n = { ...p, ...patch }; savePrefs(n); return n })
  }

  const finished = runs.filter(r => r.status === 'completed' || r.status === 'partial' || r.status === 'failed')
  const scenarios = [...new Set(finished.map(r => r.scenario?.name ?? r.scenario ?? '—'))]

  const filtered = (scenario === 'all' ? finished : finished.filter(r => (r.scenario?.name ?? r.scenario) === scenario))
    .reverse()
    .slice(0, prefs.count)

  if (filtered.length < 2) return null

  function getValue(r) {
    if (prefs.metric === 'latency') {
      const steps = r.results?.steps ?? {}
      const vals = Object.values(steps).map(s => s.avg).filter(Boolean)
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
    }
    const res = r.results
    if (!res || res.total === 0) return 0
    return Math.round((res.passed / res.total) * 100)
  }

  const values = filtered.map(getValue)
  const maxVal = prefs.metric === 'latency' ? Math.max(...values, 1) : 100
  const minVal = prefs.metric === 'latency' ? 0 : 0

  function xOf(i) { return PAD.left + (i / (filtered.length - 1)) * INNER_W }
  function yOf(v) { return PAD.top + (1 - (v - minVal) / (maxVal - minVal)) * INNER_H }

  const polyline = values.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ')
  const areaPoints = [
    `${xOf(0)},${PAD.top + INNER_H}`,
    ...values.map((v, i) => `${xOf(i)},${yOf(v)}`),
    `${xOf(values.length - 1)},${PAD.top + INNER_H}`,
  ].join(' ')

  const avgVal = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  const avgLabel = prefs.metric === 'latency' ? (avgVal >= 1000 ? `${(avgVal/1000).toFixed(1)}s` : `${avgVal}ms`) : `${avgVal}%`

  const scenarioLabel = scenario === 'all' ? 'всі сценарії' : scenario

  return (
    <div className="mb-5 bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl px-4 pt-3 pb-2 relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--c-text-4)]">
          {METRICS.find(m => m.value === prefs.metric)?.label} · {filtered.length} ранів · {scenarioLabel}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--c-text-3)]">avg {avgLabel}</span>
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setPanelOpen(p => !p)}
              title="Налаштування графіку"
              className={`text-[var(--c-text-4)] hover:text-[var(--c-text)] transition-colors cursor-pointer leading-none ${panelOpen ? 'text-[var(--c-accent)]' : ''}`}
            >
              ⚙
            </button>

            {panelOpen && (
              <div className="absolute right-0 top-6 z-30 bg-[var(--c-surface-2)] border border-[var(--c-border)] rounded-xl shadow-xl p-4 w-52 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--c-text-3)] font-medium">Кількість ранів</span>
                  <div className="flex gap-1">
                    {COUNTS.map(c => (
                      <button key={c} onClick={() => setAndSave({ count: c })}
                        className={`flex-1 text-xs py-1 rounded-md transition-colors cursor-pointer ${prefs.count === c ? 'bg-[var(--c-accent-bg)] text-white' : 'bg-[var(--c-surface)] text-[var(--c-text-3)] hover:text-[var(--c-text)]'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--c-text-3)] font-medium">Метрика</span>
                  {METRICS.map(m => (
                    <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="metric" value={m.value} checked={prefs.metric === m.value}
                        onChange={() => setAndSave({ metric: m.value })}
                        className="accent-[var(--c-accent)]" />
                      <span className="text-xs text-[var(--c-text-2)]">{m.label}</span>
                    </label>
                  ))}
                </div>

                {scenarios.length > 1 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[var(--c-text-3)] font-medium">Сценарій</span>
                    <select
                      value={scenario}
                      onChange={e => setScenario(e.target.value)}
                      className="bg-[var(--c-surface)] border border-[var(--c-border-input)] rounded-lg px-2 py-1 text-xs text-[var(--c-text)] outline-none"
                    >
                      <option value="all">Всі</option>
                      {scenarios.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--c-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1={PAD.left} y1={PAD.top} x2={W - PAD.right} y2={PAD.top}
          stroke="var(--c-border)" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1={PAD.left} y1={PAD.top + INNER_H} x2={W - PAD.right} y2={PAD.top + INNER_H}
          stroke="var(--c-border)" strokeWidth="0.5" />
        <line x1={PAD.left} y1={yOf((maxVal + minVal) / 2)} x2={W - PAD.right} y2={yOf((maxVal + minVal) / 2)}
          stroke="var(--c-border)" strokeWidth="0.5" strokeDasharray="3,3" />

        <text x={W - PAD.right + 3} y={PAD.top + 3} fontSize="7" fill="var(--c-text-4)">
          {prefs.metric === 'latency' ? (maxVal >= 1000 ? `${(maxVal/1000).toFixed(0)}s` : `${maxVal}`) : '100'}
        </text>
        <text x={W - PAD.right + 3} y={yOf((maxVal + minVal) / 2) + 3} fontSize="7" fill="var(--c-text-4)">
          {prefs.metric === 'latency' ? (maxVal >= 2000 ? `${(maxVal/2000).toFixed(0)}s` : `${Math.round(maxVal/2)}`) : '50'}
        </text>
        <text x={W - PAD.right + 3} y={PAD.top + INNER_H + 3} fontSize="7" fill="var(--c-text-4)">0</text>

        <polygon points={areaPoints} fill="url(#trend-fill)" />
        <polyline points={polyline} fill="none" stroke="var(--c-accent)"
          strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

        {values.map((v, i) => (
          <circle key={i} cx={xOf(i)} cy={yOf(v)} r="3.5"
            fill={DOT_COLOR[filtered[i].status] ?? '#6b7280'}
            stroke="var(--c-surface)" strokeWidth="1.5"
            className="cursor-pointer"
            onMouseEnter={() => {
              const r = filtered[i]
              const name = r.scenario?.name ?? r.scenario ?? '—'
              const date = new Date(r.createdAt).toLocaleString('uk-UA')
              const valLabel = prefs.metric === 'latency'
                ? (v >= 1000 ? `${(v/1000).toFixed(1)}s avg` : `${v}ms avg`)
                : `${v}%`
              setTooltip({ x: xOf(i), y: yOf(v), text: `#${r.id} ${name}`, sub: `${valLabel} · ${date}` })
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {tooltip && (() => {
          const tx = Math.min(Math.max(tooltip.x - 65, 0), W - PAD.right - 130)
          const ty = tooltip.y < PAD.top + 20 ? tooltip.y + 12 : tooltip.y - 28
          return (
            <g>
              <rect x={tx} y={ty - 10} width="140" height="22" rx="4"
                fill="var(--c-surface-2)" stroke="var(--c-border)" strokeWidth="0.5" />
              <text x={tx + 6} y={ty} fontSize="7.5" fill="var(--c-text)" fontWeight="600">{tooltip.text}</text>
              <text x={tx + 6} y={ty + 10} fontSize="7" fill="var(--c-text-4)">{tooltip.sub}</text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
