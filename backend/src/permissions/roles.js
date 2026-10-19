// Три фіксовані ролі (не fine-grained ABAC — масштаб проєкту цього не
// виправдовує): viewer бачить результати, admin керує тестами/сценаріями,
// superadmin додатково керує іншими адмінами. Ієрархія сувора (кожна вища
// роль — надмножина нижчої), тож достатньо числового рівня, а не окремих
// permission-ключів per дію.
export const ROLES = ["viewer", "admin", "superadmin"];

const ROLE_LEVEL = { viewer: 0, admin: 1, superadmin: 2 };

export function isValidRole(role) {
  return ROLES.includes(role);
}

// true, якщо role — відома роль з рівнем >= minRole. Невідома/відсутня роль
// (null, зіпсовані дані) -> fail closed, ніколи не "за замовчуванням true".
export function roleAtLeast(role, minRole) {
  const level = ROLE_LEVEL[role];
  const minLevel = ROLE_LEVEL[minRole];
  if (level === undefined || minLevel === undefined) return false;
  return level >= minLevel;
}
