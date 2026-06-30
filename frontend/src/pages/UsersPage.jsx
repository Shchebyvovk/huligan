import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import { useT } from '../i18n'
import AppHeader from '../components/AppHeader'
import SettingsModal from '../components/SettingsModal'

function GeneratePanel({ onGenerated }) {
  const t = useT()
  const [count, setCount] = useState(100)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handle() {
    setLoading(true)
    setMsg('')
    try {
      await api.generateUsers(Number(count))
      setMsg(t('users_generated', count))
      onGenerated()
    } catch {
      setMsg(t('users_generate_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="number" min={1} max={10000} value={count}
        onChange={e => setCount(e.target.value)}
        className="w-24 bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors"
      />
      <button
        onClick={handle} disabled={loading}
        className="bg-[var(--c-accent-bg)] hover:bg-[var(--c-accent-hover)] disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
      >
        {loading ? t('users_generating') : t('users_generate')}
      </button>
      {msg && <span className="text-sm text-[var(--c-text-3)]">{msg}</span>}
    </div>
  )
}

export default function UsersPage() {
  const t = useT()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [apps, setApps] = useState([])
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const LIMIT = 50

  const load = useCallback(async (p = 1, f = filter) => {
    setLoading(true)
    try {
      const params = { page: p, limit: LIMIT }
      if (f) params.registeredIn = f
      const data = await api.getUsers(params)
      if (data) { setUsers(data.users); setTotal(data.total) }
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load(1, filter)
    setPage(1)
  }, [filter])

  useEffect(() => {
    api.getUserApps().then(setApps).catch(() => {})
  }, [])

  function handleGenerated() {
    load(page)
    api.getUserApps().then(setApps).catch(() => {})
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
      <AppHeader onSettings={() => setSettingsOpen(true)} />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium">{t('users_title')}</h2>
            <p className="text-sm text-[var(--c-text-4)] mt-0.5">
              {t('users_total', total)}
            </p>
          </div>
          <GeneratePanel onGenerated={handleGenerated} />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-[var(--c-text-3)]">{t('users_filter_label')}</span>
          <button
            onClick={() => setFilter('')}
            className={`text-xs px-3 py-1 rounded-full transition-colors cursor-pointer ${!filter ? 'bg-[var(--c-accent-faint)] text-[var(--c-accent)]' : 'bg-[var(--c-surface-2)] text-[var(--c-text-3)] hover:text-[var(--c-text)]'}`}
          >
            {t('users_filter_all')}
          </button>
          <button
            onClick={() => setFilter('__fresh__')}
            className={`text-xs px-3 py-1 rounded-full transition-colors cursor-pointer ${filter === '__fresh__' ? 'bg-[var(--c-accent-faint)] text-[var(--c-accent)]' : 'bg-[var(--c-surface-2)] text-[var(--c-text-3)] hover:text-[var(--c-text)]'}`}
          >
            {t('users_filter_fresh')}
          </button>
          {apps.map(app => (
            <button
              key={app}
              onClick={() => setFilter(app)}
              title={app}
              className={`text-xs px-3 py-1 rounded-full transition-colors cursor-pointer max-w-[160px] truncate ${filter === app ? 'bg-[var(--c-accent-faint)] text-[var(--c-accent)]' : 'bg-[var(--c-surface-2)] text-[var(--c-text-3)] hover:text-[var(--c-text)]'}`}
            >
              {new URL(app).hostname}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--c-border)] text-[var(--c-text-3)] text-xs">
                <th className="text-left px-4 py-3 font-medium">{t('users_col_name')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('users_col_email')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('users_col_phone')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('users_col_registered')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--c-text-4)]">{t('runs_loading')}</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--c-text-4)]">{t('users_empty')}</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-[var(--c-border)] last:border-0 hover:bg-[var(--c-surface-2)] transition-colors">
                  <td className="px-4 py-3 text-[var(--c-text)]">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-[var(--c-text-2)] font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-[var(--c-text-3)]">{u.phone}</td>
                  <td className="px-4 py-3">
                    {u.registeredIn?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.registeredIn.map(app => (
                          <span key={app} title={app} className="text-xs bg-[var(--c-accent-faint)] text-[var(--c-accent)] px-2 py-0.5 rounded-full">
                            {(() => { try { return new URL(app).hostname } catch { return app } })()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-green-400">{t('users_fresh')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-[var(--c-text-4)]">
              {t('users_page', page, totalPages)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { const p = page - 1; setPage(p); load(p) }}
                disabled={page === 1}
                className="text-sm px-3 py-1.5 bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg text-[var(--c-text-3)] hover:text-[var(--c-text)] disabled:opacity-40 transition-colors cursor-pointer"
              >
                ←
              </button>
              <button
                onClick={() => { const p = page + 1; setPage(p); load(p) }}
                disabled={page === totalPages}
                className="text-sm px-3 py-1.5 bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg text-[var(--c-text-3)] hover:text-[var(--c-text)] disabled:opacity-40 transition-colors cursor-pointer"
              >
                →
              </button>
            </div>
          </div>
        )}
      </main>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
