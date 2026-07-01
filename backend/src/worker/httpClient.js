const BASE_DELAYS = { 429: 3000, 502: 1500, 503: 2000 }
const MAX_RETRIES = 3

function jitter(base) {
  // exponential backoff + full jitter: random in [0, base * 2^attempt]
  return base + Math.random() * base
}

export function makeHttpClient(baseUrl, { fetch: _fetch = globalThis.fetch } = {}) {
  let cookie = ''

  async function post(path, body, extraHeaders = {}) {
    let lastStatus
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const res = await _fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...extraHeaders },
        body: JSON.stringify(body),
      })
      if (res.ok) return res
      lastStatus = res.status
      const base = BASE_DELAYS[res.status]
      if (!base || attempt === MAX_RETRIES) break
      // exponential: attempt 0→base, 1→2x, 2→4x, capped at 15s; plus jitter
      const delay = Math.min(jitter(base * Math.pow(2, attempt)), 15000)
      await new Promise(r => setTimeout(r, delay))
    }
    throw new Error(`${lastStatus}`)
  }

  // Повертає { ms, result } — ms завжди записується навіть при помилці
  async function timed(fn) {
    const start = Date.now()
    try {
      const result = await fn()
      return { ms: Date.now() - start, result }
    } catch (err) {
      err.ms = Date.now() - start
      throw err
    }
  }

  return {
    async register(payload) {
      const { ms, result } = await timed(async () => {
        const res = await post('/api/register', payload)
        cookie = res.headers.get('set-cookie') ?? ''
        return res
      })
      return ms
    },

    async login(payload) {
      const { ms } = await timed(async () => {
        const res = await post('/api/login', payload)
        cookie = res.headers.get('set-cookie') ?? ''
        return res
      })
      return ms
    },

    async sendMessage(payload) {
      const { ms } = await timed(() => post('/api/messages', payload, cookie ? { Cookie: cookie } : {}))
      return ms
    },

    async logout() {
      const { ms } = await timed(() => post('/api/logout', {}, cookie ? { Cookie: cookie } : {}))
      cookie = ''
      return ms
    },

    wait({ ms } = {}) {
      return new Promise(res => setTimeout(res, ms ?? 0))
    },
  }
}
