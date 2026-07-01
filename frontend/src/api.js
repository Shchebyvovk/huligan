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
  getUsers:       (params = {})    => {
    const q = new URLSearchParams({ page: 1, limit: 50, ...params }).toString()
    return request('GET', `/api/users?${q}`).then(r => r?.json())
  },
  getUserApps:    ()               => request('GET', '/api/users/apps').then(r => r?.json() ?? []),
  getUsersStats:  (targetUrl)      => request('GET', `/api/users/stats?targetUrl=${encodeURIComponent(targetUrl)}`).then(r => r?.json()),
  generateUsers:  (count)          => request('POST', '/api/users/generate', { count }),
  getScenarios:   ()               => request('GET',  '/api/scenarios').then(r => r?.json() ?? []),
  createScenario: (data)           => request('POST', '/api/scenarios', data),
  deleteScenario: (name)           => request('DELETE', `/api/scenarios/${encodeURIComponent(name)}`),
  getAdmins:      ()               => request('GET',  '/api/admins').then(r => r?.json() ?? []),
  inviteAdmin:    (email)          => request('POST', '/api/admins/invite', { email }),
  getInvite:      (token)          => fetch(`${BASE}/api/invite/${token}`).then(r => r.ok ? r.json() : null),
  acceptInvite:   (token, password) => fetch(`${BASE}/api/invite/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }).then(r => r.json()),
}
