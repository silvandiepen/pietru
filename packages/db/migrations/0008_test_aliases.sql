-- Test email aliases: users can claim addresses under test.pietru.dev
-- for testing purposes. Max 100 aliases per user (enforced in application logic).

CREATE TABLE IF NOT EXISTS test_aliases (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  project_id TEXT REFERENCES projects(id),
  local_part TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One alias per local_part (globally unique across all users)
CREATE UNIQUE INDEX IF NOT EXISTS idx_test_aliases_local_part ON test_aliases(local_part);

-- Fast lookup by local_part for inbound routing
CREATE INDEX IF NOT EXISTS idx_test_aliases_local_part_active ON test_aliases(local_part, is_active);

-- Lookup by user
CREATE INDEX IF NOT EXISTS idx_test_aliases_user_id ON test_aliases(user_id);

-- Lookup by project
CREATE INDEX IF NOT EXISTS idx_test_aliases_project_id ON test_aliases(project_id);
