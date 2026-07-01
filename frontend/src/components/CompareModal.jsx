import { useT, useLocale } from '../i18n'

function fmt(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

function delta(a, b) {
  if (!a || !b) return null
  const pct = Math.round(((b - a) / a) * 100)
  return pct
}

function DeltaBadge({ pct }) {
  if (pct === null) return null
  const better = pct < 0
  return (
    <span className={`text-xs font-mono ${better ? 'text-green-400' : 'text-red-400'}`}>
      {better ? '↓' : '↑'}{Math.abs(pct)}%
    </span>
  )
}

function RunMeta({ run, locale }) {
  const time = new Date(run.createdAt ?? run.started_at).toLocaleString(locale === 'en' ? 'en-GB' : 'uk-UA')
  const name = run.scenario?.name ?? run.scenario ?? '—'
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold text-[var(--c-text)]">{name}</span>
      <span className="text-xs text-[var(--c-text-4)]">#{run.id} · {run.concurrency} users · {time}</span>
      {run.targetUrl && <span className="text-xs text-[var(--c-text-4)] opacity-60">{run.targetUrl}</span>}
    </div>
  )
}

export default function CompareModal({ runA, runB, onClose }) {
  const t = useT()
  const { locale } = useLocale()

  const stepsA = runA.results?.steps ?? {}
  const stepsB = runB.results?.steps ?? {}
  const allActions = [...new Set([...Object.keys(stepsA), ...Object.keys(stepsB)])]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
      <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--c-border)] shrink-0">
          <h2 className="font-semibold text-[var(--c-text)]">{t('compare_title')}</h2>
          <button onClick={onClose} className="text-[var(--c-text-4)] hover:text-[var(--c-text)] text-xl leading-none cursor-pointer">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Headers */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-5">
            <div className="bg-[var(--c-surface-2)] rounded-lg p-3">
              <RunMeta run={runA} locale={locale} />
            </div>
            <div className="flex items-center justify-center text-[var(--c-text-4)] text-sm font-mono">vs</div>
            <div className="bg-[var(--c-surface-2)] rounded-lg p-3">
              <RunMeta run={runB} locale={locale} />
            </div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-4">
            {[runA, runB].map((run, idx) => {
              const r = run.results
              if (!r) return <div key={idx} className="text-xs text-[var(--c-text-4)]">немає даних</div>
              return (
                <div key={idx} className="flex gap-4 text-center">
                  <div><div className="text-lg font-semibold text-green-400">{r.passed}</div><div className="text-xs text-[var(--c-text-4)]">passed</div></div>
                  <div><div className="text-lg font-semibold text-red-400">{r.failed}</div><div className="text-xs text-[var(--c-text-4)]">failed</div></div>
                  <div><div className="text-lg font-semibold text-[var(--c-accent)]">{r.total > 0 ? Math.round(r.passed / r.total * 100) : 0}%</div><div className="text-xs text-[var(--c-text-4)]">success</div></div>
                </div>
              )
            })}
            <div />
          </div>

          {/* Per-step comparison */}
          {allActions.length > 0 && (
            <div className="border border-[var(--c-border)] rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_3rem_1fr] text-xs text-[var(--c-text-4)] bg-[var(--c-surface-2)] px-4 py-2">
                <span>#{runA.id}</span>
                <span className="text-center">{t('compare_delta')}</span>
                <span className="text-right">#{runB.id}</span>
              </div>
              {allActions.map(action => {
                const a = stepsA[action]
                const b = stepsB[action]
                const pct = a && b ? delta(a.avg, b.avg) : null
                return (
                  <div key={action} className="border-t border-[var(--c-border)]">
                    <div className="px-4 py-1 text-xs text-[var(--c-text-4)] bg-[var(--c-surface-2)/50] font-mono">
                      {action}
                    </div>
                    <div className="grid grid-cols-[1fr_3rem_1fr] px-4 py-2 text-sm">
                      {/* Run A */}
                      <div className="flex flex-col gap-0.5">
                        {a ? (
                          <>
                            <span className="text-[var(--c-text)]">{fmt(a.avg)} avg</span>
                            <span className="text-xs text-[var(--c-text-4)]">{fmt(a.min)}–{fmt(a.max)}</span>
                            {a.failed > 0 && <span className="text-xs text-red-400">{a.failed} err</span>}
                          </>
                        ) : <span className="text-[var(--c-text-4)]">—</span>}
                      </div>
                      {/* Delta */}
                      <div className="flex items-center justify-center">
                        <DeltaBadge pct={pct} />
                      </div>
                      {/* Run B */}
                      <div className="flex flex-col gap-0.5 items-end text-right">
                        {b ? (
                          <>
                            <span className="text-[var(--c-text)]">{fmt(b.avg)} avg</span>
                            <span className="text-xs text-[var(--c-text-4)]">{fmt(b.min)}–{fmt(b.max)}</span>
                            {b.failed > 0 && <span className="text-xs text-red-400">{b.failed} err</span>}
                          </>
                        ) : <span className="text-[var(--c-text-4)]">—</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
