import Fastify from 'fastify'
import { randomBytes } from 'node:crypto'

const app = Fastify({ logger: false })

// In-memory store
const sessions = new Map()
const WINDOW_MS = 10_000  // 10-секундне вікно для статистики

// Rolling window: масив { ts, endpoint, ms, ok }
const reqs = []

function record(endpoint, ms, ok) {
  reqs.push({ ts: Date.now(), endpoint, ms, ok })
}

function windowStats() {
  const cutoff = Date.now() - WINDOW_MS
  const recent = reqs.filter(r => r.ts >= cutoff)

  const byEndpoint = {}
  for (const r of recent) {
    if (!byEndpoint[r.endpoint]) byEndpoint[r.endpoint] = { count: 0, errors: 0, totalMs: 0 }
    byEndpoint[r.endpoint].count++
    byEndpoint[r.endpoint].totalMs += r.ms
    if (!r.ok) byEndpoint[r.endpoint].errors++
  }

  const summary = {}
  for (const [ep, s] of Object.entries(byEndpoint)) {
    summary[ep] = {
      reqPerSec: +(s.count / (WINDOW_MS / 1000)).toFixed(1),
      avgMs: s.count ? Math.round(s.totalMs / s.count) : 0,
      errors: s.errors,
    }
  }

  return {
    windowSec: WINDOW_MS / 1000,
    totalReqInWindow: recent.length,
    reqPerSec: +(recent.length / (WINDOW_MS / 1000)).toFixed(1),
    endpoints: summary,
  }
}


function delay(min, max) {
  const ms = min + Math.random() * (max - min)
  return new Promise(res => setTimeout(res, ms))
}

function getToken(req) {
  const raw = req.headers.cookie ?? ''
  const match = raw.match(/(?:^|;\s*)session=([^;]+)/)
  return match?.[1] ?? null
}

// Health
app.get('/health', async () => ({
  status: 'ok',
  activeSessions: sessions.size,
  uptime: Math.floor(process.uptime()),
  stats: windowStats(),
}))

// Register
app.post('/api/register', async (req, reply) => {
  const start = Date.now()
  const { email, password } = req.body ?? {}

  await delay(80, 200)

  if (!email || !password) {
    record('register', Date.now() - start, false)
    return reply.code(400).send({ message: "email і password обов'язкові" })
  }

  const token = randomBytes(16).toString('hex')
  sessions.set(token, { email, createdAt: Date.now() })
  record('register', Date.now() - start, true)
  console.log(`[register] ${email} → ok (${Date.now() - start}ms)`)

  reply
    .header('set-cookie', `session=${token}; HttpOnly; Path=/; SameSite=Lax`)
    .code(201)
    .send({ ok: true, email })
})

// Login
app.post('/api/login', async (req, reply) => {
  const start = Date.now()
  const { email, password } = req.body ?? {}

  await delay(50, 150)

  if (!email || !password) {
    record('login', Date.now() - start, false)
    return reply.code(400).send({ message: "email і password обов'язкові" })
  }

  if (!password) {
    record('login', Date.now() - start, false)
    return reply.code(401).send({ message: 'Невірні credentials' })
  }

  const token = randomBytes(16).toString('hex')
  sessions.set(token, { email, createdAt: Date.now() })
  record('login', Date.now() - start, true)
  console.log(`[login]   ${email} → ok (${Date.now() - start}ms)`)

  reply
    .header('set-cookie', `session=${token}; HttpOnly; Path=/; SameSite=Lax`)
    .code(200)
    .send({ ok: true, email })
})

// Send message
app.post('/api/messages', async (req, reply) => {
  const start = Date.now()
  const token = getToken(req)

  await delay(20, 80)

  if (!token || !sessions.has(token)) {
    record('messages', Date.now() - start, false)
    console.log(`[message] UNAUTHORIZED (no valid session)`)
    return reply.code(401).send({ message: 'Unauthorized' })
  }

  const { text } = req.body ?? {}
  if (!text) {
    record('messages', Date.now() - start, false)
    return reply.code(400).send({ message: "text обов'язковий" })
  }

  const { email } = sessions.get(token)
  record('messages', Date.now() - start, true)
  console.log(`[message] ${email} → "${text}" (${Date.now() - start}ms)`)
  return { ok: true, messageId: randomBytes(8).toString('hex') }
})

// Logout
app.post('/api/logout', async (req, reply) => {
  const start = Date.now()
  const token = getToken(req)

  await delay(5, 15)

  const email = token ? sessions.get(token)?.email : null
  if (token) sessions.delete(token)
  record('logout', Date.now() - start, true)
  console.log(`[logout]  ${email ?? 'unknown'} → ok (${Date.now() - start}ms)`)

  reply
    .header('set-cookie', 'session=; HttpOnly; Path=/; Max-Age=0')
    .send({ ok: true })
})

// Прибираємо старі записи зі статистики (> 1 хв) і протухлі сесії
setInterval(() => {
  const cutoff = Date.now() - 60_000
  while (reqs.length && reqs[0].ts < cutoff) reqs.shift()

  const sessionCutoff = Date.now() - 30 * 60 * 1000
  for (const [token, { createdAt }] of sessions) {
    if (createdAt < sessionCutoff) sessions.delete(token)
  }
}, 60_000)

const port = Number(process.env.PORT ?? 3001)
await app.listen({ port, host: '0.0.0.0' })
console.log(`Target server on port ${port}  →  /health for stats`)
