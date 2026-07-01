import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useT } from '../i18n'
import ScenarioEditorModal from './ScenarioEditorModal'

export default function NewRunModal({ onClose }) {
  const t = useT()
  const [scenarios, setScenarios] = useState([])
  const [scenarioName, setScenarioName] = useState('')
  const [concurrency, setConcurrency] = useState(100)
  const [targetUrl, setTargetUrl] = useState(() => localStorage.getItem('huligan_target_url') ?? '')
  const [usersCount, setUsersCount] = useState('')
  const [rampUpSec, setRampUpSec] = useState('')
  const [usersStats, setUsersStats] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generateCount, setGenerateCount] = useState(100)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    api.getScenarios().then(list => {
      setScenarios(list)
      if (list.length > 0) setScenarioName(list[0].name)
    })
  }, [])

  useEffect(() => {
    if (!targetUrl.trim()) { setUsersStats(null); return }
    api.getUsersStats(targetUrl.trim()).then(s => setUsersStats(s)).catch(() => {})
  }, [targetUrl])

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

      if (scenarios.some(s => s.name === name)) {
        setError(t('new_run_error_duplicate', name))
        setUploading(false)
        return
      }

      const res = await api.createScenario({ name, steps })
      if (!res || !res.ok) {
        const body = await res?.json().catch(() => null)
        setError(body?.message || t('new_run_error_invalid_file'))
        return
      }
      const saved = await res.json()
      setScenarios(list => [...list.filter(s => s.name !== saved.name), saved].slice(0, 10))
      setScenarioName(saved.name)
    } catch {
      setError(t('new_run_error_file'))
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(name) {
    setError('')
    try {
      const res = await api.deleteScenario(name)
      if (!res || !res.ok) {
        const body = await res?.json().catch(() => null)
        setError(body?.message || t('new_run_error_delete'))
        return
      }
      setScenarios(list => {
        const next = list.filter(s => s.name !== name)
        if (scenarioName === name) setScenarioName(next[0]?.name ?? '')
        return next
      })
    } catch {
      setError(t('new_run_error_delete'))
    } finally {
      setConfirmDelete(null)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      await api.generateUsers(Number(generateCount))
      const stats = await api.getUsersStats(targetUrl.trim())
      setUsersStats(stats)
    } catch {
      setError(t('new_run_error_generate'))
    } finally {
      setGenerating(false)
    }
  }

  async function handleStart() {
    const scenario = scenarios.find(s => s.name === scenarioName)
    if (!scenario) { setError(t('new_run_error_scenario')); return }
    if (!targetUrl.trim()) { setError(t('new_run_error_target_url')); return }

    const parsedUsersCount = usersCount ? Number(usersCount) : null
    if (parsedUsersCount && parsedUsersCount > Number(concurrency)) {
      setError(t('new_run_error_users_count')); return
    }

    localStorage.setItem('huligan_target_url', targetUrl.trim())
    setLoading(true)
    setError('')
    try {
      const run = await api.createRun({
        scenario, concurrency: Number(concurrency),
        targetUrl: targetUrl.trim(),
        usersCount: parsedUsersCount,
        rampUpMs: rampUpSec ? Math.round(Number(rampUpSec) * 1000) : 0,
      })
      if (run) onClose()
    } catch {
      setError(t('new_run_error_run'))
    } finally {
      setLoading(false)
    }
  }

  const freshCount = usersStats?.fresh ?? 0
  const totalCount = usersStats?.total ?? 0

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-[var(--c-text)]">{t('new_run_title')}</h2>
          <button onClick={onClose} className="text-[var(--c-text-4)] hover:text-[var(--c-text)] transition-colors text-xl leading-none cursor-pointer">×</button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Scenario */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[var(--c-text-3)]">
              {t('new_run_scenario')}
              <span className="text-[var(--c-text-4)] ml-2">({t('new_run_scenario_hint')})</span>
            </label>
            <div className="flex gap-2">
              <select
                value={scenarioName}
                onChange={e => setScenarioName(e.target.value)}
                disabled={scenarios.length === 0}
                className="flex-1 bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors disabled:opacity-50"
              >
                {scenarios.length === 0 && <option value="">{t('new_run_no_scenarios')}</option>}
                {scenarios.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              {scenarioName && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(scenarioName)}
                  className="text-sm text-[var(--c-text-4)] hover:text-red-400 transition-colors px-2 cursor-pointer"
                >
                  {t('new_run_delete')}
                </button>
              )}
            </div>

            {confirmDelete && (
              <div className="mt-1 flex items-center gap-3 text-sm bg-[var(--c-surface-3)] rounded-lg px-3 py-2">
                <span className="text-[var(--c-text-2)] flex-1">{t('new_run_delete_confirm', confirmDelete)}</span>
                <button onClick={() => handleDelete(confirmDelete)} className="text-red-400 hover:text-red-300 cursor-pointer font-medium">{t('new_run_confirm_yes')}</button>
                <button onClick={() => setConfirmDelete(null)} className="text-[var(--c-text-3)] hover:text-[var(--c-text)] cursor-pointer">{t('new_run_confirm_no')}</button>
              </div>
            )}
          </div>

          {/* Upload / Editor */}
          <div className="flex gap-4">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="text-sm text-[var(--c-accent)] hover:text-[var(--c-accent-hover)] transition-colors cursor-pointer disabled:opacity-50">
              {uploading ? t('new_run_uploading') : t('new_run_upload')}
            </button>
            <button type="button" onClick={() => setEditorOpen(true)}
              className="text-sm text-[var(--c-accent)] hover:text-[var(--c-accent-hover)] transition-colors cursor-pointer">
              {t('new_run_ai')}
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileUpload} className="hidden" />
          </div>

          {/* Target URL */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[var(--c-text-3)]">{t('new_run_target_url')}</label>
            <input type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
              placeholder="https://chat.example.com"
              className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors placeholder:text-[var(--c-text-4)]"
            />
          </div>

          {/* Users pool */}
          <div className="flex flex-col gap-2 bg-[var(--c-surface-2)] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--c-text-3)]">{t('new_run_users_pool')}</span>
              {usersStats && (
                <span className="text-xs text-[var(--c-text-4)]">
                  {t('new_run_users_fresh', freshCount, totalCount)}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="number" min={1} max={Number(concurrency)} value={usersCount}
                onChange={e => setUsersCount(e.target.value)}
                placeholder={t('new_run_users_pool_hint')}
                className="flex-1 bg-[var(--c-surface)] border border-[var(--c-border-input)] rounded-lg px-3 py-1.5 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors placeholder:text-[var(--c-text-4)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="number" min={1} max={10000} value={generateCount}
                onChange={e => setGenerateCount(e.target.value)}
                className="w-20 bg-[var(--c-surface)] border border-[var(--c-border-input)] rounded-lg px-2 py-1 text-[var(--c-text)] text-xs outline-none focus:border-[var(--c-accent-border)] transition-colors"
              />
              <button type="button" onClick={handleGenerate} disabled={generating || !targetUrl.trim()}
                className="text-xs text-[var(--c-accent)] hover:text-[var(--c-accent-hover)] transition-colors cursor-pointer disabled:opacity-40">
                {generating ? t('new_run_generating') : t('new_run_generate_users')}
              </button>
            </div>
          </div>

          {/* Concurrency + Ramp-up */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm text-[var(--c-text-3)]">
                {t('new_run_users')}
              </label>
              <input type="number" min={1} max={10000} value={concurrency}
                onChange={e => setConcurrency(e.target.value)}
                className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1 w-28">
              <label className="text-sm text-[var(--c-text-3)] flex items-center gap-1">
                {t('new_run_ramp_up')}
                <span
                  title={t('new_run_ramp_up_tooltip')}
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-[var(--c-text-4)] text-[var(--c-text-4)] text-[9px] cursor-help leading-none"
                >?</span>
              </label>
              <input type="number" min={0} max={3600} value={rampUpSec}
                onChange={e => setRampUpSec(e.target.value)}
                placeholder="0"
                className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors placeholder:text-[var(--c-text-4)]"
              />
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}

        <button onClick={handleStart} disabled={loading || scenarios.length === 0}
          className="mt-6 w-full bg-[var(--c-accent-bg)] hover:bg-[var(--c-accent-hover)] disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer">
          {loading ? t('new_run_starting') : t('new_run_start')}
        </button>
      </div>

      {editorOpen && (
        <ScenarioEditorModal
          onClose={() => setEditorOpen(false)}
          onSaved={saved => {
            setScenarios(list => [...list.filter(s => s.name !== saved.name), saved].slice(-10))
            setScenarioName(saved.name)
            setEditorOpen(false)
          }}
        />
      )}
    </div>
  )
}
