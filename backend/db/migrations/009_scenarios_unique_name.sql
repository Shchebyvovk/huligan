ALTER TABLE test_scenarios ADD COLUMN IF NOT EXISTS users JSONB;
ALTER TABLE test_scenarios ADD CONSTRAINT test_scenarios_name_unique UNIQUE (name);
