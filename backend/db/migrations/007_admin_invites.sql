CREATE TABLE IF NOT EXISTS admin_invites (
  id         SERIAL PRIMARY KEY,
  token      TEXT NOT NULL UNIQUE,
  email      TEXT NOT NULL,
  invited_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
