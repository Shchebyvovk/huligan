const RETRY_DELAYS = { 429: 2000, 502: 1000, 503: 1500 }
const MAX_RETRIES = 2

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
      const delay = RETRY_DELAYS[res.status]
      if (!delay || attempt === MAX_RETRIES) break
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
