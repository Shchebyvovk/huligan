export function makeHttpClient(baseUrl, { fetch: _fetch = globalThis.fetch } = {}) {
  let cookie = ''

  async function post(path, body, extraHeaders = {}) {
    const res = await _fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`${res.status}`)
    return res
  }

  async function timed(fn) {
    const start = Date.now()
    await fn()
    return Date.now() - start
  }

  return {
    async register(payload) {
      const ms = await timed(async () => {
        const res = await post('/api/register', payload)
        cookie = res.headers.get('set-cookie') ?? ''
      })
      return ms
    },

    async login(payload) {
      const ms = await timed(async () => {
        const res = await post('/api/login', payload)
        cookie = res.headers.get('set-cookie') ?? ''
      })
      return ms
    },

    async sendMessage(payload) {
      return timed(() => post('/api/messages', payload, cookie ? { Cookie: cookie } : {}))
    },

    async logout() {
      const ms = await timed(() => post('/api/logout', {}, cookie ? { Cookie: cookie } : {}))
      cookie = ''
      return ms
    },

    wait({ ms } = {}) {
      return new Promise(res => setTimeout(res, ms ?? 0))
    },
  }
}
