import { useState, useEffect } from 'react'
import { useT, useLocale, AVAILABLE_LOCALES } from '../i18n'
import { useTheme, AVAILABLE_THEMES } from '../theme'
import { api } from '../api'

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
        active
          ? 'bg-[var(--c-accent-faint)] text-[var(--c-accent)]'
          : 'text-[var(--c-text-3)] hover:text-[var(--c-text)]'
      }`}
    >
      {children}
    </button>
  )
}

export const MAX_RUNS_KEY = 'huligan_max_runs'
export const TRASH_DAYS_KEY = 'huligan_trash_days'
export const KEEPALIVE_URL_KEY = 'huligan_keepalive_url'
export const NOTIF_KEY = 'huligan_notifications'
export function getMaxRuns() { return Number(localStorage.getItem(MAX_RUNS_KEY) ?? 100) }
export function getTrashDays() { return Number(localStorage.getItem(TRASH_DAYS_KEY) ?? 30) }
export function getKeepaliveUrl() { return localStorage.getItem(KEEPALIVE_URL_KEY) ?? '' }
export function getNotificationsEnabled() { return localStorage.getItem(NOTIF_KEY) === 'true' }
export function notify(title, body) {
  if (!getNotificationsEnabled() || Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '/favicon.ico' })
}

function AppearanceTab({ onClose }) {
  const t = useT()
  const { locale, changeLocale } = useLocale()
  const { theme, changeTheme } = useTheme()
  const [selectedLocale, setSelectedLocale] = useState(locale)
  const [selectedTheme, setSelectedTheme] = useState(theme)
  const [maxRuns, setMaxRuns] = useState(() => getMaxRuns())
  const [trashDays, setTrashDays] = useState(() => getTrashDays())
  const [keepaliveUrl, setKeepaliveUrl] = useState(() => getKeepaliveUrl())
  const [notifEnabled, setNotifEnabled] = useState(() => getNotificationsEnabled())
  const [notifPermission, setNotifPermission] = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'denied')
  const [maxRunsError, setMaxRunsError] = useState('')
  const [trashDaysError, setTrashDaysError] = useState('')

  function handleSave() {
    const runsVal = Number(maxRuns)
    const trashVal = Number(trashDays)
    if (!runsVal || runsVal < 1 || runsVal > 1000) return setMaxRunsError('1–1000')
    if (!trashVal || trashVal < 1 || trashVal > 90) return setTrashDaysError('1–90')
    changeLocale(selectedLocale)
    changeTheme(selectedTheme)
    localStorage.setItem(MAX_RUNS_KEY, String(runsVal))
    localStorage.setItem(TRASH_DAYS_KEY, String(trashVal))
    localStorage.setItem(KEEPALIVE_URL_KEY, keepaliveUrl.trim())
    localStorage.setItem(NOTIF_KEY, String(notifEnabled))
    onClose()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-[var(--c-text-3)]">{t('settings_theme')}</label>
        <select
          value={selectedTheme}
          onChange={e => setSelectedTheme(e.target.value)}
          className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors"
        >
          {AVAILABLE_THEMES.map(th => (
            <option key={th.value} value={th.value}>{th.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-[var(--c-text-3)]">{t('settings_language')}</label>
        <select
          value={selectedLocale}
          onChange={e => setSelectedLocale(e.target.value)}
          className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors"
        >
          {AVAILABLE_LOCALES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-[var(--c-text-3)]">{t('settings_max_runs')}</label>
        <input
          type="number" min={1} max={1000} value={maxRuns}
          onChange={e => { setMaxRuns(e.target.value); setMaxRunsError('') }}
          className={`bg-[var(--c-surface-2)] border rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none transition-colors ${maxRunsError ? 'border-red-500' : 'border-[var(--c-border-input)] focus:border-[var(--c-accent-border)]'}`}
        />
        {maxRunsError
          ? <p className="text-xs text-red-400">{maxRunsError}</p>
          : <p className="text-xs text-[var(--c-text-4)]">{t('settings_max_runs_hint')}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-[var(--c-text-3)]">{t('settings_trash_days')}</label>
        <input
          type="number" min={1} max={90} value={trashDays}
          onChange={e => { setTrashDays(e.target.value); setTrashDaysError('') }}
          className={`bg-[var(--c-surface-2)] border rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none transition-colors ${trashDaysError ? 'border-red-500' : 'border-[var(--c-border-input)] focus:border-[var(--c-accent-border)]'}`}
        />
        {trashDaysError
          ? <p className="text-xs text-red-400">{trashDaysError}</p>
          : <p className="text-xs text-[var(--c-text-4)]">{t('settings_trash_days_hint')}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-[var(--c-text-3)]">Keep-alive URL</label>
        <input
          type="url"
          value={keepaliveUrl}
          onChange={e => setKeepaliveUrl(e.target.value)}
          placeholder="https://..."
          className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors placeholder:text-[var(--c-text-4)]"
        />
        <p className="text-xs text-[var(--c-text-4)]">Пінгується кожні 10 хв щоб не засинав</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--c-text-3)]">Браузерні нотифікації</label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifEnabled}
              onChange={e => setNotifEnabled(e.target.checked)}
              className="w-4 h-4 accent-[var(--c-accent)]"
            />
            <span className="text-sm text-[var(--c-text-2)]">Увімкнути</span>
          </label>
          {notifPermission !== 'granted' && (
            <button
              type="button"
              onClick={async () => {
                const perm = await Notification.requestPermission()
                setNotifPermission(perm)
                if (perm === 'granted') setNotifEnabled(true)
              }}
              className="text-xs text-[var(--c-accent)] hover:underline cursor-pointer"
            >
              Дозволити в браузері
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--c-text-4)]">
          {notifPermission === 'granted' ? '✓ Дозволено браузером' : notifPermission === 'denied' ? '✗ Заблоковано — змініть у налаштуваннях браузера' : 'Потрібен дозвіл браузера'}
        </p>
      </div>

      <button
        onClick={handleSave}
        className="mt-2 w-full bg-[var(--c-accent-bg)] hover:bg-[var(--c-accent-hover)] text-white rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer"
      >
        {t('settings_save')}
      </button>
    </div>
  )
}

function AdminsTab() {
  const [admins, setAdmins] = useState([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAdmins().then(setAdmins).finally(() => setLoading(false))
  }, [])

  async function handleInvite(e) {
    e.preventDefault()
    setSending(true)
    setError('')
    setInviteLink('')
    try {
      const res = await api.inviteAdmin(email)
      if (res && res.status === 201) {
        const data = await res.json()
        setInviteLink(data.link)
        setEmail('')
      } else {
        const data = res ? await res.json() : null
        setError(data?.message ?? 'Помилка')
      }
    } catch {
      setError('Помилка сервера')
    } finally {
      setSending(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* список адмінів */}
      <div>
        <p className="text-xs text-[var(--c-text-3)] mb-2">Адміністратори</p>
        {loading ? (
          <p className="text-xs text-[var(--c-text-4)]">Завантаження...</p>
        ) : (
          <div className="flex flex-col gap-1">
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-[var(--c-surface-2)] rounded-lg px-3 py-2">
                <span className="text-sm text-[var(--c-text)] font-mono">{a.email}</span>
                <span className="text-xs text-[var(--c-text-4)]">
                  {new Date(a.createdAt).toLocaleDateString('uk-UA')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* форма запрошення */}
      <div>
        <p className="text-xs text-[var(--c-text-3)] mb-2">Запросити нового адміна</p>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="email@example.com"
            className="flex-1 bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-sm text-[var(--c-text)] outline-none focus:border-[var(--c-accent-border)] transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !email}
            className="bg-[var(--c-accent-bg)] hover:bg-[var(--c-accent-hover)] disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            {sending ? '...' : 'Запросити'}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        {inviteLink && (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-xs text-[var(--c-text-3)]">Посилання для запрошення (діє 24г):</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 bg-[var(--c-surface-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-xs text-[var(--c-text-3)] font-mono outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] hover:border-[var(--c-accent-border)] text-[var(--c-text-3)] hover:text-[var(--c-accent)] text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                {copied ? '✓ Скопійовано' : 'Копіювати'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SettingsModal({ onClose }) {
  const t = useT()
  const [tab, setTab] = useState('appearance')

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--c-text)]">{t('settings_title')}</h2>
          <button
            onClick={onClose}
            className="text-[var(--c-text-4)] hover:text-[var(--c-text)] transition-colors text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="flex gap-1 mb-5">
          <Tab active={tab === 'appearance'} onClick={() => setTab('appearance')}>Вигляд</Tab>
          <Tab active={tab === 'admins'} onClick={() => setTab('admins')}>Адміни</Tab>
        </div>

        {tab === 'appearance' && <AppearanceTab onClose={onClose} />}
        {tab === 'admins' && <AdminsTab />}
      </div>
    </div>
  )
}
