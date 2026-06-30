-- Admin users (логін в адмінку)
CREATE TABLE admin_users (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,            -- salt:hash (scrypt)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Сесії адмінки
CREATE TABLE sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sessions_expires_at ON sessions(expires_at);

-- Тестові юзери (симулюються воркерами)
CREATE TABLE test_users (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  meta       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Сценарії (DSL)
CREATE TABLE test_scenarios (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  steps      JSONB NOT NULL,           -- масив кроків parseScenario
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Запуски навантажувальних тестів
CREATE TABLE test_runs (
  id             SERIAL PRIMARY KEY,
  scenario_id    INTEGER NOT NULL REFERENCES test_scenarios(id),
  concurrency    INTEGER NOT NULL,     -- кількість паралельних віртуальних юзерів
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','running','completed','failed')),
  started_at     TIMESTAMPTZ,
  finished_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Сесії тестових юзерів (створюються воркерами під час тесту)
CREATE TABLE test_sessions (
  id          SERIAL PRIMARY KEY,
  run_id      INTEGER NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES test_users(id),
  token       TEXT NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- Налаштування юзера адмінки
CREATE TABLE user_settings (
  user_id    INTEGER PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  settings   JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
