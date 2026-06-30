import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api'
import { useT } from '../i18n'

export default function AppHeader({ onSettings }) {
  const navigate = useNavigate()
  const location = useLocation()
  const t = useT()

  async function handleLogout() {
    await api.logout()
    navigate('/login')
  }

  const navLink = (path, label) => (
    <button
      onClick={() => navigate(path)}
      className={`text-sm transition-colors cursor-pointer ${
        location.pathname === path
          ? 'text-[var(--c-accent)]'
          : 'text-[var(--c-text-3)] hover:text-[var(--c-text)]'
      }`}
    >
      {label}
    </button>
  )

  return (
    <header className="border-b border-[var(--c-border)] px-6 py-4 flex items-center justify-between bg-[var(--c-surface)]">
      <span className="font-semibold text-lg text-[var(--c-text)]">
        Huligan <span className="text-[var(--c-accent)]">Admin</span>
      </span>
      <div className="flex items-center gap-5">
        {navLink('/dashboard', t('nav_runs'))}
        {navLink('/users', t('nav_users'))}
        <button
          onClick={onSettings}
          className="text-sm text-[var(--c-text-3)] hover:text-[var(--c-text)] transition-colors cursor-pointer"
        >
          {t('nav_settings')}
        </button>
        <button
          onClick={handleLogout}
          className="text-sm text-[var(--c-text-3)] hover:text-[var(--c-text)] transition-colors cursor-pointer"
        >
          {t('nav_logout')}
        </button>
      </div>
    </header>
  )
}
