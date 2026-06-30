import { useState, useEffect } from 'react'
import { api } from '../api'

const DEFAULT_CONTENT = JSON.stringify(
  [
    { action: "login", payload: { email: "user@example.com", password: "secret" } },
    { action: "send_message", payload: { text: "hello" } },
    { action: "wait", payload: { ms: 200 } },
    { action: "logout" },
  ],
  null,
  2
)

const AI_SETTINGS_KEY = 'huligan_ai_settings'

function loadAiSettings() {
  try { return JSON.parse(localStorage.getItem(AI_SETTINGS_KEY) ?? '{}') } catch { return {} }
}

function AiSettingsPanel({ onClose }) {
  const [settings, setSettings] = useState(loadAiSettings)

  function save() {
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings))
    onClose()
  }

  return (
    <div className="mt-3 bg-gray-950 border border-gray-700 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">Налаштування AI-агента</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-sm cursor-pointer">✕</button>
      </div>
      {[
        { key: 'apiUrl',  label: 'API URL',  placeholder: 'https://api.openai.com/v1' },
        { key: 'apiKey',  label: 'API Key',  placeholder: 'sk-...',  type: 'password' },
        { key: 'model',   label: 'Модель',   placeholder: 'gpt-4o' },
      ].map(({ key, label, placeholder, type = 'text' }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">{label}</label>
          <input
            type={type}
            value={settings[key] ?? ''}
            onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
            placeholder={placeholder}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
          />
        </div>
      ))}
      <button
        onClick={save}
        className="mt-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg py-1.5 transition-colors cursor-pointer"
      >
        Зберегти налаштування
      </button>
    </div>
  )
}

function AiGeneratePanel() {
  const [prompt, setPrompt] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="mt-3 bg-gray-950 border border-gray-700 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">Генерація сценарію AI</span>
        <button
          onClick={() => setSettingsOpen(v => !v)}
          className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          ⚙ Налаштування
        </button>
      </div>

      {settingsOpen && <AiSettingsPanel onClose={() => setSettingsOpen(false)} />}

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Опишіть що має робити сценарій..."
        rows={3}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors resize-none placeholder:text-gray-600"
      />

      <div className="flex items-center gap-3">
        <button
          disabled
          title="В розробці"
          className="bg-purple-600/40 text-white/40 text-sm rounded-lg px-4 py-1.5 cursor-not-allowed"
        >
          Згенерувати
        </button>
        <span className="text-xs text-gray-500">В розробці</span>
      </div>
    </div>
  )
}

export default function ScenarioEditorModal({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [validationMsg, setValidationMsg] = useState(null)
  const [validationOk, setValidationOk] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [aiOpen, setAiOpen] = useState(false)

  useEffect(() => {
    setValidationOk(false)
    setValidationMsg(null)
  }, [content])

  function validate() {
    try {
      const parsed = JSON.parse(content)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setValidationMsg('Сценарій має бути непорожнім масивом кроків')
        setValidationOk(false)
        return
      }
      const actions = ['login', 'send_message', 'wait', 'logout']
      for (const [i, step] of parsed.entries()) {
        if (!step.action) { setValidationMsg(`Крок ${i}: відсутнє поле action`); setValidationOk(false); return }
        if (!actions.includes(step.action)) { setValidationMsg(`Крок ${i}: невідомий action "${step.action}"`); setValidationOk(false); return }
        if (step.action === 'login' && (!step.payload?.email || !step.payload?.password)) {
          setValidationMsg(`Крок ${i}: login потребує payload.email і payload.password`); setValidationOk(false); return
        }
        if (step.action === 'send_message' && !step.payload?.text) {
          setValidationMsg(`Крок ${i}: send_message потребує payload.text`); setValidationOk(false); return
        }
        if (step.action === 'wait' && typeof step.payload?.ms !== 'number') {
          setValidationMsg(`Крок ${i}: wait потребує payload.ms (число)`); setValidationOk(false); return
        }
      }
      setValidationMsg('Сценарій валідний ✓')
      setValidationOk(true)
    } catch {
      setValidationMsg('Невалідний JSON')
      setValidationOk(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) { setError('Введіть назву сценарію'); return }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) { setError('Назва: лише літери, цифри, - та _'); return }

    let steps
    try {
      steps = JSON.parse(content)
    } catch {
      setError('Невалідний JSON — виправте перед збереженням')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await api.createScenario({ name, steps })
      if (!res || !res.ok) {
        const body = await res?.json().catch(() => null)
        setError(body?.message || 'Не вдалося зберегти сценарій')
        return
      }
      const saved = await res.json()
      onSaved(saved)
    } catch {
      setError('Не вдалося зберегти сценарій')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <h2 className="font-semibold">Редактор сценарію</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none cursor-pointer">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Назва сценарію</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="my-scenario"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
            />
          </div>

          {/* Editor */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Кроки сценарію (JSON)</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAiOpen(v => !v)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  ✦ Згенерувати AI
                </button>
                <button
                  onClick={validate}
                  className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Перевірити
                </button>
              </div>
            </div>

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              spellCheck={false}
              rows={14}
              className="bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-green-300 text-sm font-mono outline-none focus:border-purple-500 transition-colors resize-none"
            />

            {validationMsg && (
              <p className={`text-xs mt-0.5 ${validationOk ? 'text-green-400' : 'text-red-400'}`}>
                {validationMsg}
              </p>
            )}
          </div>

          {/* AI panel */}
          {aiOpen && <AiGeneratePanel />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 shrink-0 flex flex-col gap-3">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer"
            >
              {saving ? 'Збереження...' : 'Зберегти сценарій'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
