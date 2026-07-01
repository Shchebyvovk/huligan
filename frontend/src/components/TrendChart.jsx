import { useState } from 'react'

const W = 600
const H = 80
const PAD = { top: 10, bottom: 18, left: 4, right: 4 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top - PAD.bottom

const DOT_COLOR = {
  completed: '#4ade80',
  partial:   '#facc15',
  failed:    '#f87171',
  running:   '#60a5fa',
  pending:   '#6b7280',
}

export default function TrendChart({ runs }) {
  const [tooltip, setTooltip] = useState(null)

  // Only finished runs, oldest→newest, last 30
  const data = [...runs]
    .filter(r => r.status === 'completed' || r.status === 'partial' || r.status === 'failed')
    .reverse()
    .slice(0, 30)

  if (data.length < 2) return null

  const pcts = data.map(r => {
    const res = r.results
    if (!res || res.total === 0) return 0
    return Math.round((res.passed / res.total) * 100)
  })

  function xOf(i) { return PAD.left + (i / (data.length - 1)) * INNER_W }
  function yOf(v) { return PAD.top + (1 - v / 100) * INNER_H }

  const polyline = pcts.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ')

  // Filled area under line
  const areaPoints = [
    `${xOf(0)},${PAD.top + INNER_H}`,
    ...pcts.map((v, i) => `${xOf(i)},${yOf(v)}`),
    `${xOf(pcts.length - 1)},${PAD.top + INNER_H}`,
  ].join(' ')

  const avgPct = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)

  return (
    <div className="mb-5 bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl px-4 pt-3 pb-2 relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--c-text-4)]">Успішність останніх {data.length} ранів</span>
        <span className="text-xs font-mono text-[var(--c-text-3)]">avg {avgPct}%</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--c-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 0% and 100% grid lines */}
        <line x1={PAD.left} y1={PAD.top} x2={W - PAD.right} y2={PAD.top}
          stroke="var(--c-border)" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1={PAD.left} y1={PAD.top + INNER_H} x2={W - PAD.right} y2={PAD.top + INNER_H}
          stroke="var(--c-border)" strokeWidth="0.5" />

        {/* 50% line */}
        <line x1={PAD.left} y1={yOf(50)} x2={W - PAD.right} y2={yOf(50)}
          stroke="var(--c-border)" strokeWidth="0.5" strokeDasharray="3,3" />
        <text x={W - PAD.right + 2} y={yOf(50) + 3} fontSize="7" fill="var(--c-text-4)">50</text>
        <text x={W - PAD.right + 2} y={PAD.top + 3} fontSize="7" fill="var(--c-text-4)">100</text>
        <text x={W - PAD.right + 2} y={PAD.top + INNER_H + 3} fontSize="7" fill="var(--c-text-4)">0</text>

        {/* Area fill */}
        <polygon points={areaPoints} fill="url(#trend-fill)" />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--c-accent)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {pcts.map((v, i) => (
          <circle
            key={i}
            cx={xOf(i)} cy={yOf(v)} r="3.5"
            fill={DOT_COLOR[data[i].status] ?? '#6b7280'}
            stroke="var(--c-surface)" strokeWidth="1.5"
            className="cursor-pointer"
            onMouseEnter={e => {
              const r = data[i]
              const name = r.scenario?.name ?? r.scenario ?? '—'
              const date = new Date(r.createdAt).toLocaleString('uk-UA')
              setTooltip({ x: xOf(i), y: yOf(v), text: `#${r.id} ${name}`, sub: `${v}% · ${date}` })
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* Tooltip */}
        {tooltip && (() => {
          const tx = Math.min(tooltip.x, W - 120)
          const ty = tooltip.y < PAD.top + 20 ? tooltip.y + 12 : tooltip.y - 28
          return (
            <g>
              <rect x={tx - 4} y={ty - 10} width="130" height="22" rx="4"
                fill="var(--c-surface-2)" stroke="var(--c-border)" strokeWidth="0.5" />
              <text x={tx} y={ty} fontSize="7.5" fill="var(--c-text)" fontWeight="600">{tooltip.text}</text>
              <text x={tx} y={ty + 10} fontSize="7" fill="var(--c-text-4)">{tooltip.sub}</text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
