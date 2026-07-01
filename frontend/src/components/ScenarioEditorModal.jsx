import { useState, useEffect } from 'react'
import { api } from '../api'
import { useT } from '../i18n'

const DEFAULT_STEPS = JSON.stringify(
  [
    { action: "login" },
    { action: "send_message", payload: { text: "hello" } },
    { action: "wait", payload: { ms: 200 } },
    { action: "logout" },
  ],
  null, 2
)

const DEFAULT_STEPS_REGISTER = JSON.stringify(
  [
    { action: "register" },
    { action: "send_message", payload: { text: "hello" } },
    { action: "logout" },
  ],
  null, 2
)

const DEFAULT_USERS = [
  { email: 'user1@test.com', password: 'password123' },
  { email: 'user2@test.com', password: 'password123' },
]

const AI_SETTINGS_KEY = 'huligan_ai_settings'

function loadAiSettings() {
  try { return JSON.parse(localStorage.getItem(AI_SETTINGS_KEY) ?? '{}') } catch { return {} }
}

function UsersPool({ users, onChange }) {
  const t = useT()

  function update(i, field, value) {
    const next = users.map((u, j) => j === i ? { ...u, [field]: value } : u)
    onChange(next)
  }

  function add() {
    onChange([...users, { email: '', password: 'password123' }])
  }

  function remove(i) {
    onChange(users.filter((_, j) => j !== i))
  }

  return (
    <div className="flex flex-col gap-2">
      {users.map((u, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="email"
            value={u.email}
            onChange={e => update(i, 'email', e.target.value)}
            placeholder="email@test.com"
            className="flex-1 bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-1.5 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors placeholder:text-[var(--c-text-4)]"
          />
          <input
            type="text"
            value={u.password}
            onChange={e => update(i, 'password', e.target.value)}
            placeholder="password"
            className="w-32 bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-1.5 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors placeholder:text-[var(--c-text-4)]"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={users.length === 1}
            className="text-[var(--c-text-4)] hover:text-red-400 transition-colors disabled:opacity-30 cursor-pointer px-1"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-sm text-[var(--c-accent)] hover:text-[var(--c-accent-hover)] transition-colors text-left cursor-pointer"
      >
        + {t('editor_users_add')}
      </button>
    </div>
  )
}

function AiSettingsPanel({ onClose }) {
  const t = useT()
  const [settings, setSettings] = useState(loadAiSettings)

  function save() {
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings))
    onClose()
  }

  return (
    <div className="mt-3 bg-[var(--c-bg)] border border-[var(--c-border-input)] rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--c-text-2)]">{t('ai_settings_title')}</span>
        <button onClick={onClose} className="text-[var(--c-text-4)] hover:text-[var(--c-text)] text-sm cursor-pointer">✕</button>
      </div>
      {[
        { key: 'apiUrl', label: t('ai_api_url'),  placeholder: 'https://api.openai.com/v1' },
        { key: 'apiKey', label: t('ai_api_key'),  placeholder: 'sk-...',  type: 'password' },
        { key: 'model',  label: t('ai_model'),    placeholder: 'gpt-4o' },
      ].map(({ key, label, placeholder, type = 'text' }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-xs text-[var(--c-text-3)]">{label}</label>
          <input
            type={type}
            value={settings[key] ?? ''}
            onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
            placeholder={placeholder}
            className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-1.5 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors placeholder:text-[var(--c-text-4)]"
          />
        </div>
      ))}
      <button onClick={save} className="mt-1 bg-[var(--c-surface-3)] hover:bg-[var(--c-surface-2)] text-[var(--c-text)] text-sm rounded-lg py-1.5 transition-colors cursor-pointer">
        {t('ai_settings_save')}
      </button>
    </div>
  )
}

function AiGeneratePanel() {
  const t = useT()
  const [prompt, setPrompt] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="mt-3 bg-[var(--c-bg)] border border-[var(--c-border-input)] rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--c-text-2)]">{t('ai_title')}</span>
        <button onClick={() => setSettingsOpen(v => !v)} className="text-xs text-[var(--c-text-3)] hover:text-[var(--c-text)] transition-colors cursor-pointer">
          {t('ai_settings_btn')}
        </button>
      </div>
      {settingsOpen && <AiSettingsPanel onClose={() => setSettingsOpen(false)} />}
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder={t('ai_prompt_placeholder')}
        rows={3}
        className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors resize-none placeholder:text-[var(--c-text-4)]"
      />
      <div className="flex items-center gap-3">
        <button disabled title={t('ai_wip')} className="bg-[var(--c-accent-faint)] text-[var(--c-text-4)] text-sm rounded-lg px-4 py-1.5 cursor-not-allowed">
          {t('ai_generate')}
        </button>
        <span className="text-xs text-[var(--c-text-4)]">{t('ai_wip')}</span>
      </div>
    </div>
  )
}

export default function ScenarioEditorModal({ onClose, onSaved }) {
  const t = useT()
  const [name, setName] = useState('')
  const [users, setUsers] = useState(DEFAULT_USERS)
  const [usePool, setUsePool] = useState(true)
  const [content, setContent] = useState(DEFAULT_STEPS)
  const [validationMsg, setValidationMsg] = useState(null)
  const [validationOk, setValidationOk] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [aiOpen, setAiOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)

  useEffect(() => {
    setValidationOk(false)
    setValidationMsg(null)
  }, [content, users, usePool])

  function validate() {
    try {
      const steps = JSON.parse(content)
      if (!Array.isArray(steps) || steps.length === 0) {
        setValidationMsg(t('editor_validation_array')); setValidationOk(false); return
      }
      const actions = ['register', 'login', 'send_message', 'wait', 'logout']
      for (const [i, step] of steps.entries()) {
        if (!step.action) { setValidationMsg(t('editor_validation_no_action', i)); setValidationOk(false); return }
        if (!actions.includes(step.action)) { setValidationMsg(t('editor_validation_unknown', i, step.action)); setValidationOk(false); return }
        if (['login', 'register'].includes(step.action) && !usePool && (!step.payload?.email || !step.payload?.password)) {
          setValidationMsg(t('editor_validation_login', i)); setValidationOk(false); return
        }
        if (step.action === 'send_message' && !step.payload?.text) {
          setValidationMsg(t('editor_validation_send', i)); setValidationOk(false); return
        }
        if (step.action === 'wait' && typeof step.payload?.ms !== 'number') {
          setValidationMsg(t('editor_validation_wait', i)); setValidationOk(false); return
        }
      }
      if (usePool) {
        const invalid = users.some(u => !u.email || !u.password)
        if (invalid) { setValidationMsg(t('editor_validation_users')); setValidationOk(false); return }
      }
      setValidationMsg(t('editor_valid'))
      setValidationOk(true)
    } catch {
      setValidationMsg('Invalid JSON'); setValidationOk(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) { setError(t('editor_error_name_empty')); return }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) { setError(t('editor_error_name_invalid')); return }

    let steps
    try { steps = JSON.parse(content) }
    catch { setError(t('editor_error_json')); return }

    const scenarioData = usePool
      ? { users: users.filter(u => u.email && u.password), steps }
      : steps

    setSaving(true)
    setError('')
    try {
      const res = await api.createScenario({ name, steps: scenarioData })
      if (!res || !res.ok) {
        const body = await res?.json().catch(() => null)
        setError(body?.message || t('editor_error_save'))
        return
      }
      onSaved(await res.json())
    } catch {
      setError(t('editor_error_save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
      <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--c-border)] shrink-0">
          <h2 className="font-semibold text-[var(--c-text)]">{t('editor_title')}</h2>
          <button onClick={onClose} className="text-[var(--c-text-4)] hover:text-[var(--c-text)] transition-colors text-xl leading-none cursor-pointer">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[var(--c-text-3)]">{t('editor_name')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('editor_name_placeholder')}
              className="bg-[var(--c-surface-2)] border border-[var(--c-border-input)] rounded-lg px-3 py-2 text-[var(--c-text)] text-sm outline-none focus:border-[var(--c-accent-border)] transition-colors placeholder:text-[var(--c-text-4)]"
            />
          </div>

          {/* Users pool */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <label className="text-sm text-[var(--c-text-3)]">{t('editor_users_title')}</label>
              <button
                type="button"
                onClick={() => setUsePool(v => !v)}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors cursor-pointer ${usePool ? 'bg-[var(--c-accent-faint)] text-[var(--c-accent)]' : 'bg-[var(--c-surface-3)] text-[var(--c-text-4)]'}`}
              >
                {usePool ? t('editor_users_on') : t('editor_users_off')}
              </button>
            </div>
            {usePool && <UsersPool users={users} onChange={setUsers} />}
            {!usePool && (
              <p className="text-xs text-[var(--c-text-4)]">{t('editor_users_off_hint')}</p>
            )}
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--c-text-3)]">{t('editor_steps')}</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setContent(DEFAULT_STEPS_REGISTER)}
                  className="text-xs text-[var(--c-text-4)] hover:text-[var(--c-text-2)] transition-colors cursor-pointer"
                >
                  register template
                </button>
                <button onClick={() => setAiOpen(v => !v)} className="text-xs text-[var(--c-accent)] hover:text-[var(--c-accent-hover)] transition-colors cursor-pointer">
                  {t('editor_ai')}
                </button>
                <button onClick={validate} className="text-xs text-[var(--c-text-3)] hover:text-[var(--c-text)] transition-colors cursor-pointer">
                  {t('editor_validate')}
                </button>
                <button
                  type="button"
                  onClick={() => setDocsOpen(v => !v)}
                  className="text-xs text-[var(--c-text-4)] hover:text-[var(--c-text-2)] transition-colors cursor-pointer"
                  title="Довідка по кроках"
                >
                  ?
                </button>
              </div>
            </div>

            {docsOpen && (
              <div className="bg-[var(--c-bg)] border border-[var(--c-border)] rounded-lg p-4 text-xs text-[var(--c-text-3)] font-mono leading-relaxed">
                <p className="text-[var(--c-text-2)] font-sans font-medium mb-2 not-mono">Доступні дії (action)</p>
                <div className="flex flex-col gap-2">
                  <div><span className="text-green-400">register</span> — реєстрація нового юзера. Payload: <span className="text-yellow-300">{`{ email, password }`}</span> або з пулу.</div>
                  <div><span className="text-green-400">login</span> — вхід в систему. Payload: <span className="text-yellow-300">{`{ email, password }`}</span> або з пулу.</div>
                  <div><span className="text-green-400">send_message</span> — відправити повідомлення. Payload: <span className="text-yellow-300">{`{ text: "..." }`}</span></div>
                  <div><span className="text-green-400">wait</span> — пауза. Payload: <span className="text-yellow-300">{`{ ms: 500 }`}</span></div>
                  <div><span className="text-green-400">logout</span> — вихід. Payload не потрібен.</div>
                </div>
                <p className="text-[var(--c-text-2)] font-sans font-medium mt-3 mb-1 not-mono">Приклад — реєстрація</p>
                <pre className="text-[var(--c-text-3)] whitespace-pre-wrap">{`[
  { "action": "register" },
  { "action": "send_message", "payload": { "text": "hi" } },
  { "action": "logout" }
]`}</pre>
                <p className="text-[var(--c-text-2)] font-sans font-medium mt-3 mb-1 not-mono">Приклад — логін з паузою</p>
                <pre className="text-[var(--c-text-3)] whitespace-pre-wrap">{`[
  { "action": "login" },
  { "action": "wait", "payload": { "ms": 1000 } },
  { "action": "send_message", "payload": { "text": "hello" } },
  { "action": "logout" }
]`}</pre>
              </div>
            )}

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              spellCheck={false}
              rows={12}
              className="bg-[var(--c-bg)] border border-[var(--c-border-input)] rounded-lg px-4 py-3 text-green-300 text-sm font-mono outline-none focus:border-[var(--c-accent-border)] transition-colors resize-none"
            />

            {validationMsg && (
              <p className={`text-xs mt-0.5 ${validationOk ? 'text-green-400' : 'text-red-400'}`}>
                {validationMsg}
              </p>
            )}
          </div>

          {aiOpen && <AiGeneratePanel />}
        </div>

        <div className="px-6 py-4 border-t border-[var(--c-border)] shrink-0 flex flex-col gap-3">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-[var(--c-surface-2)] hover:bg-[var(--c-surface-3)] text-[var(--c-text-2)] rounded-lg py-2 text-sm transition-colors cursor-pointer">
              {t('editor_cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-[var(--c-accent-bg)] hover:bg-[var(--c-accent-hover)] disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer">
              {saving ? t('editor_saving') : t('editor_save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
