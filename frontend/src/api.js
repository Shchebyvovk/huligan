const BASE = import.meta.env.VITE_API_URL ?? ''

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    window.location.href = '/login'
    return null
  }
  return res
}

export const api = {
  login:         (email, password) => request('POST', '/api/auth/login', { email, password }),
  logout:        ()                => request('POST', '/api/auth/logout'),
  getRuns:       ()                => request('GET',  '/api/runs').then(r => r?.json() ?? []),
  createRun:     (data)            => request('POST', '/api/runs', data).then(r => r?.json()),
  getScenarios:   ()               => request('GET',  '/api/scenarios').then(r => r?.json() ?? []),
  createScenario: (data)           => request('POST', '/api/scenarios', data),
  deleteScenario: (name)           => request('DELETE', `/api/scenarios/${encodeURIComponent(name)}`),
}
