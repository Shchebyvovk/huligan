import Fastify from 'fastify'
import { randomBytes } from 'node:crypto'

const app = Fastify({ logger: false })

// In-memory store
const sessions = new Map()   // token → { email, createdAt }
const stats = { logins: 0, messages: 0, logouts: 0, errors: 0 }

const FAKE_USERS = new Set([
  'user@test.com', 'alice@test.com', 'bob@test.com',
  'tester@test.com', 'load@test.com',
])
const FAKE_PASSWORD = 'password123'

function delay(min, max) {
  const ms = min + Math.random() * (max - min)
  return new Promise(res => setTimeout(res, ms))
}

function getToken(req) {
  const raw = req.headers.cookie ?? ''
  const match = raw.match(/(?:^|;\s*)session=([^;]+)/)
  return match?.[1] ?? null
}

// Health / stats
app.get('/health', async () => ({
  status: 'ok',
  activeSessions: sessions.size,
  stats,
  uptime: Math.floor(process.uptime()),
}))

// Login
app.post('/api/login', async (req, reply) => {
  const { email, password } = req.body ?? {}

  await delay(50, 150)  // імітує DB lookup + bcrypt

  if (!email || !password) {
    stats.errors++
    return reply.code(400).send({ message: 'email і password обов\'язкові' })
  }

  const emailOk = FAKE_USERS.has(email) || email.endsWith('@test.com')
  if (!emailOk || password !== FAKE_PASSWORD) {
    stats.errors++
    return reply.code(401).send({ message: 'Невірні credentials' })
  }

  const token = randomBytes(16).toString('hex')
  sessions.set(token, { email, createdAt: Date.now() })
  stats.logins++

  reply
    .header('set-cookie', `session=${token}; HttpOnly; Path=/; SameSite=Lax`)
    .code(200)
    .send({ ok: true, email })
})

// Send message
app.post('/api/messages', async (req, reply) => {
  const token = getToken(req)

  await delay(20, 80)  // імітує DB write

  if (!token || !sessions.has(token)) {
    stats.errors++
    return reply.code(401).send({ message: 'Unauthorized' })
  }

  const { text } = req.body ?? {}
  if (!text) {
    stats.errors++
    return reply.code(400).send({ message: 'text обов\'язковий' })
  }

  stats.messages++
  return { ok: true, messageId: randomBytes(8).toString('hex') }
})

// Logout
app.post('/api/logout', async (req, reply) => {
  const token = getToken(req)

  await delay(5, 15)

  if (token) {
    sessions.delete(token)
    stats.logouts++
  }

  reply
    .header('set-cookie', 'session=; HttpOnly; Path=/; Max-Age=0')
    .send({ ok: true })
})

// Очищення старих сесій кожні 5 хвилин
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000  // 30 хв
  for (const [token, { createdAt }] of sessions) {
    if (createdAt < cutoff) sessions.delete(token)
  }
}, 5 * 60 * 1000)

const port = Number(process.env.PORT ?? 3001)
await app.listen({ port, host: '0.0.0.0' })
console.log(`Target server running on port ${port}`)
console.log(`Health: http://localhost:${port}/health`)
