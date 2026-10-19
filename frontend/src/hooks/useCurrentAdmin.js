import { useEffect, useState } from 'react'
import { api } from '../api'

const ROLE_LEVEL = { viewer: 0, admin: 1, superadmin: 2 }

// Реальний контроль доступу — на бекенді (requireRole у кожному роуті).
// Це лише UX: ховає/дизейблить кнопки дій, яких viewer однаково не зможе
// виконати, щоб не показувати йому робочі на вигляд контроли, що впадуть у 403.
export function useCurrentAdmin() {
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.getMe().then(me => { if (!cancelled) setRole(me?.role ?? null) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  function atLeast(minRole) {
    if (!role) return false
    return (ROLE_LEVEL[role] ?? -1) >= (ROLE_LEVEL[minRole] ?? Infinity)
  }

  return { role, loading, atLeast, isAdmin: atLeast('admin'), isSuperadmin: atLeast('superadmin') }
}
