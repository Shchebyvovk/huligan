import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeHttpClient } from './httpClient.js'

const BASE = 'https://target.example.com'

function mockFetch(responses) {
  let i = 0
  return vi.fn(async () => {
    const r = responses[i++] ?? { ok: true, status: 200 }
    return {
      ok: r.ok,
      status: r.status,
      json: async () => r.body ?? {},
      headers: { get: () => r.cookie ?? null },
    }
  })
}

describe('makeHttpClient', () => {
  let fetch

  beforeEach(() => {
    fetch = mockFetch([
      { ok: true, cookie: 'session=abc' },  // login
      { ok: true },                           // sendMessage
      { ok: true },                           // logout
    ])
  })

  it('login POSTs credentials and stores cookie', async () => {
    const client = makeHttpClient(BASE, { fetch })
    await client.login({ email: 'u@test.com', password: 'pass' })

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/login`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'u@test.com', password: 'pass' }),
      })
    )
  })

  it('sendMessage POSTs text with session cookie', async () => {
    const client = makeHttpClient(BASE, { fetch })
    await client.login({ email: 'u@test.com', password: 'pass' })
    await client.sendMessage({ text: 'hello' })

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      `${BASE}/api/messages`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'hello' }),
        headers: expect.objectContaining({ Cookie: 'session=abc' }),
      })
    )
  })

  it('logout POSTs with session cookie', async () => {
    const client = makeHttpClient(BASE, { fetch })
    await client.login({ email: 'u@test.com', password: 'pass' })
    await client.logout()

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      `${BASE}/api/logout`,
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('wait resolves after delay', async () => {
    vi.useFakeTimers()
    const client = makeHttpClient(BASE, { fetch })
    const p = client.wait({ ms: 100 })
    vi.advanceTimersByTime(100)
    await expect(p).resolves.toBeUndefined()
    vi.useRealTimers()
  })

  it('throws when login fails', async () => {
    fetch = mockFetch([{ ok: false, status: 401 }])
    const client = makeHttpClient(BASE, { fetch })
    await expect(client.login({ email: 'x', password: 'y' })).rejects.toThrow('401')
  })

  it('throws when sendMessage fails', async () => {
    fetch = mockFetch([
      { ok: true, cookie: 'session=abc' },
      { ok: false, status: 500 },
    ])
    const client = makeHttpClient(BASE, { fetch })
    await client.login({ email: 'u@test.com', password: 'pass' })
    await expect(client.sendMessage({ text: 'hi' })).rejects.toThrow('500')
  })
})
