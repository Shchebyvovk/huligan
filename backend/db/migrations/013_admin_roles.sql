-- Roles & permissions (CLAUDE.md TODO: "Система ролей і дозволів").
-- Default 'superadmin' on admin_users grandfathers every EXISTING admin at
-- their current (today: unconditional full) privilege level — a silent
-- downgrade on deploy would be a surprise regression. New admins created via
-- invite get whatever role the invite specifies (admins.js always passes it
-- explicitly; the column default only matters for rows the app itself didn't
-- just insert, i.e. these pre-existing ones).
ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'superadmin'
  CHECK (role IN ('viewer', 'admin', 'superadmin'));

-- admin_invites.role: the role the invite will grant once accepted. Default
-- 'admin' (not 'superadmin') so a forgotten role field on invite creation
-- never silently mints a new superadmin.
ALTER TABLE admin_invites ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'
  CHECK (role IN ('viewer', 'admin', 'superadmin'));
