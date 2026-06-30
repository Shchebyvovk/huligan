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

  return {
    async login(payload) {
      const res = await post('/api/login', payload)
      cookie = res.headers.get('set-cookie') ?? ''
    },

    async sendMessage(payload) {
      await post('/api/messages', payload, cookie ? { Cookie: cookie } : {})
    },

    async logout() {
      await post('/api/logout', {}, cookie ? { Cookie: cookie } : {})
      cookie = ''
    },

    wait({ ms } = {}) {
      return new Promise(res => setTimeout(res, ms ?? 0))
    },
  }
}
