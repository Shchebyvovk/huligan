import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function InvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('loading') // loading | ready | submitting | done | invalid
  const [error, setError] = useState('')

  useEffect(() => {
    api.getInvite(token).then(data => {
      if (!data) { setStatus('invalid'); return }
      setEmail(data.email)
      setStatus('ready')
    })
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setStatus('submitting')
    try {
      const res = await api.acceptInvite(token, password)
      if (res.ok) {
        setStatus('done')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setError(res.message ?? 'Помилка')
        setStatus('ready')
      }
    } catch {
      setError('Помилка сервера')
      setStatus('ready')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
      <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl w-full max-w-sm p-8">
        <h1 className="text-lg font-semibold text-[var(--c-text)] mb-1">
          Huligan <span className="text-[var(--c-accent)]">Admin</span>
        </h1>
        <p className="text-sm text-[var(--c-text-3)] mb-6">Встановіть пароль для входу</p>

        {status === 'loading' && (
          <p className="text-sm text-[var(--c-text-4)]">Перевірка посилання...</p>
        )}

        {status === 'invalid' && (
          <p className="text-sm text-red-400">Посилання недійсне або вичерпане.</p>
        )}

        {status === 'done' && (
          <p className="text-sm text-green-400">Акаунт створено! Перенаправлення на вхід...</p>
        )}

        {(status === 'ready' || status === 'submitting') && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--c-text-3)]">Email</label>
              <div className="bg-[var(--c-surface-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-sm text-[var(--c-text-3)]">
                {email}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--c-text-3)]">Новий пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                placeholder="Введіть пароль"
                className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-sm text-[var(--c-text)] outline-none focus:border-[var(--c-accent-border)] transition-colors"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={status === 'submitting' || !password}
              className="bg-[var(--c-accent-bg)] hover:bg-[var(--c-accent-hover)] disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
            >
              {status === 'submitting' ? 'Збереження...' : 'Встановити пароль'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
