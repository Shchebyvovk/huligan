CREATE TABLE IF NOT EXISTS test_users (
  id            SERIAL PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT NOT NULL,
  address       TEXT NOT NULL,
  password      TEXT NOT NULL,
  registered_in JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
