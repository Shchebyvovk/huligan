CREATE TABLE IF NOT EXISTS scheduled_runs (
  id SERIAL PRIMARY KEY,
  scenario_name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  concurrency INTEGER NOT NULL DEFAULT 1,
  ramp_up_ms INTEGER NOT NULL DEFAULT 0,
  users_count INTEGER,
  scheduled_at TIMESTAMPTZ NOT NULL,
  repeat_interval_ms BIGINT,
  max_iterations INTEGER,
  iterations_done INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
