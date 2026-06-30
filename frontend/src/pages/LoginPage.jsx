import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useT } from '../i18n'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const t = useT()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.login(email, password)
      if (!res) return
      if (!res.ok) {
        const { message } = await res.json()
        setError(message || t('login_error_credentials'))
        return
      }
      navigate('/dashboard')
    } catch {
      setError(t('login_error_server'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[var(--c-text)] text-center mb-8">
          {t('login_title')} <span className="text-[var(--c-accent)]">{t('login_subtitle')}</span>
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl p-8 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[var(--c-text-3)]" htmlFor="email">{t('login_email')}</label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-[var(--c-text-3)]" htmlFor="password">{t('login_password')}</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[var(--c-accent-bg)] hover:bg-[var(--c-accent-hover)] disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer"
          >
            {loading ? t('login_submitting') : t('login_submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
